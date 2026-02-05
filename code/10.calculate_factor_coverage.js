var ForestExtent = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/ForestExtent'),
    ForestChange = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/ForestChange'),
    RiskExtent = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/RiskExtent'),
    Grids_HEX_20 = ee.FeatureCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/region/Grids_HEX_20');

// load forest extent data
var forestExtMask_2001 = ForestExtent.filterDate('2001-1-1', '2002-1-1').first();

// load forest change data
var canopyMinChgImg = ForestChange.filter(ee.Filter.eq('type', 'min')).first();

var changeTypeItems = [
  {alias: 'def', content: canopyMinChgImg.eq(3)},
  {alias: 'deg', content: canopyMinChgImg.eq(2)}
];

// load risk extent data
function getRiskExtMask(typeName, eqVlu) {
  var image = RiskExtent.filter(ee.Filter.eq('type', typeName))
                        .first()
                        .updateMask(forestExtMask_2001)
                        .unmask(0);
  
  return (eqVlu !== undefined) ? image.eq(eqVlu) : image;
}

// get risk extent masks
var riskItems = [
  {alias: 'drought'},
  {alias: 'fire'},
  {alias: 'edge', content: 1},
  {alias: 'edge', content: 2},
  {alias: 'edge', content: 3},
  {alias: 'edge', content: 4},
  {alias: 'management'},
  {alias: 'modification_1'},
  {alias: 'modification_2'},
  {alias: 'modification_3'}
];

var riskExtMasks = riskItems.map(function(item) {return getRiskExtMask(item.alias, item.content)});
var riskCol = ee.ImageCollection(riskExtMasks);
var riskSumImg = riskCol.reduce(ee.Reducer.sum());

// create masks for different loss and risks
changeTypeItems.forEach(function(item) {
  var changeTypeName = item.alias;
  var changeTypeMask = item.content;

  var inExtMask = changeTypeMask.updateMask(riskSumImg).rename(changeTypeName + '_in');
  var allExtMask = changeTypeMask.rename(changeTypeName + '_all');
        
  var tempRiskExtMask = ee.Image.cat([inExtMask, allExtMask]);
  
  var reduceImg = tempRiskExtMask.multiply(ee.Image.pixelArea()).unmask(0);
  
  // define reducers for area calculations
  var bandNames = reduceImg.bandNames();
  var sumRdc = ee.Reducer.sum().forEachBand(reduceImg);
  
  // define a unit constant for converting area to million hectares
  var millionHa = 1e4 * 1e6;

  // divide grids and process chunks
  var chunkSize = 500;

  for (var chunkIdx = 0; chunkIdx < 4391 / chunkSize; chunkIdx++) {
    var gridSubList = Grids_HEX_20.toList(chunkSize, chunkIdx * chunkSize);
    var gridSubCol = ee.FeatureCollection(gridSubList);
    
    var reducedRsl = reduceImg.reduceRegions({
      collection: gridSubCol,
      reducer: sumRdc,
      scale: 250,
      tileScale: 4,
    }).map(function(feature) {
      var propertyVlus = bandNames.map(function(bandName) {
        var propertyName = ee.String(bandName);
        var propertyVlu = ee.Number(feature.get(propertyName));
        
        return propertyVlu.divide(millionHa);
      });
      var propertyDict = ee.Dictionary.fromLists(bandNames, propertyVlus);
      
      return feature.set(propertyDict);
    });

    Export.table.toDrive({
      collection: reducedRsl,
      description: 'risk_coverage_' + changeTypeName + '_' + chunkIdx,
      fileNamePrefix: 'risk_coverage_' + changeTypeName + '_' + chunkIdx,
      fileFormat: 'SHP',
      folder: 'RiskCoverage_' + changeTypeName.toUpperCase()
    });
  }
});