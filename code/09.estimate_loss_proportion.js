var CanopyCover = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/CanopyCover'),
    CanopyHeight = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/CanopyHeight'),
    ForestExtent = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/ForestExtent'),
    ForestChange = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/ForestChange'),
    RiskExtent = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/RiskExtent'),
    Grids_RECT_05_2 = ee.FeatureCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/region/Grids_RECT_10_2');

// load canopy cover data
var canopyCvrImg_2001 = CanopyCover.filterDate('2001-1-1', '2002-1-1').first();

// load canopy height data
var canopyHgtImg_2001 = CanopyHeight.filterDate('2001-1-1', '2002-1-1').first();

// load forest extent data
var forestExtMask_2001 = ForestExtent.filterDate('2001-1-1', '2002-1-1').first();

// update canopy cover and height data with forest masks
canopyCvrImg_2001 = canopyCvrImg_2001.updateMask(forestExtMask_2001).unmask(0);
canopyHgtImg_2001 = canopyHgtImg_2001.updateMask(forestExtMask_2001).unmask(0);

// load forest change data
var canopyMinChgImg = ForestChange.filter(ee.Filter.eq('type', 'min')).first();
var isDefMask = canopyMinChgImg.eq(3);
var isDegMask = canopyMinChgImg.eq(2);

// classify forests by canopy cover and height threshold
function getFrsTypeMasks(canopyCvrImg, canopyHgtImg, coverTrs, heightTrs, forestExtMask) {
  var isClsMask = canopyCvrImg.gt(coverTrs);
  var isHighMask = canopyHgtImg.gt(heightTrs);
  
  var forestTypeItems = [
    {alias: 'ch', content: isClsMask.and(isHighMask)},
    {alias: 'cl', content: isClsMask.and(isHighMask.not())},
    {alias: 'oh', content: isClsMask.not().and(isHighMask)},
    {alias: 'ol', content: isClsMask.not().and(isHighMask.not())}
  ];
  
  var finalMasks = forestTypeItems.map(function(item) {
    return item.content.updateMask(forestExtMask).rename(item.alias);
  });
  
  return finalMasks;
}

var forestTypeMasks_2001 = getFrsTypeMasks(canopyCvrImg_2001, canopyHgtImg_2001, 60, 15, forestExtMask_2001);

// create loss type images
function getChgTypeItems(forestTypeMasks, forestExtMask) {
  var finalMasks = [];
  
  var changeTypeItems = [
    {alias: 'f', content: isDefMask},
    {alias: 'g', content: isDegMask}
  ];
  
  var forestTypeNames = ['ch', 'cl', 'oh', 'ol'];
  
  changeTypeItems.forEach(function(item) {
    forestTypeMasks.forEach(function(mask, index) {
      var finalAlias_1 = item.alias + forestTypeNames[index];
      var finalAlias_2 = forestTypeNames[index];
      var finalMask_1 = item.content.and(mask).and(forestExtMask);
      var finalMask_2 = mask.and(forestExtMask);
      
      finalMasks.push({
        alias: finalAlias_1,
        content_1: finalMask_1.rename(finalAlias_1),
        content_2: finalMask_2.rename(finalAlias_2)
        });
    });
  });
  
  return finalMasks;
}

var changeTypeItems_1 = getChgTypeItems(forestTypeMasks_2001, forestExtMask_2001);

var changeTypeItems_2 = [
  {alias: 'los', content_1: isDefMask.or(isDegMask), content_2: forestExtMask_2001},
  {alias: 'def', content_1: isDefMask, content_2: forestExtMask_2001},
  {alias: 'deg', content_1: isDegMask, content_2: forestExtMask_2001}
];

var changeTypeItems = changeTypeItems_1.concat(changeTypeItems_2);

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
var otherRiskExtMask = riskSumImg.eq(0);

// create masks for different forest types and risks
changeTypeItems.forEach(function(item) {
  var changeTypeName = item.alias;
  var changeTypeMask = item.content_1;
  var forestTypeMask = item.content_2;

  var tempRiskExtMask = otherRiskExtMask.updateMask(changeTypeMask).rename(changeTypeName + '_fo_n');
  
  for (var i = 0; i < riskExtMasks.length; i++) {
    var targetRiskExtMask = riskExtMasks[i];
    
    var maxExtMask = targetRiskExtMask.updateMask(changeTypeMask).rename(changeTypeName + '_f' + i + '_x');
    
    var allExtMask = targetRiskExtMask.updateMask(forestTypeMask).rename(changeTypeName + '_f' + i + '_a');
        
    tempRiskExtMask = tempRiskExtMask.addBands([maxExtMask, allExtMask]);
  }

  var reduceImg = tempRiskExtMask.multiply(ee.Image.pixelArea()).unmask(0);
  
  // define reducers for area calculations
  var bandNames = reduceImg.bandNames();
  var sumRdc = ee.Reducer.sum().forEachBand(reduceImg);
  
  // define a unit constant for converting area to million hectares
  var millionHa = 1e4 * 1e6;

  // divide grids and process chunks
  var chunkSize = 1500;

  for (var chunkIdx = 0; chunkIdx < 11979 / chunkSize; chunkIdx++) {
    var gridSubList = Grids_RECT_05_2.toList(chunkSize, chunkIdx * chunkSize);
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
      description: 'risk_incidence_' + changeTypeName + '_' + chunkIdx,
      fileNamePrefix: 'risk_incidence_' + changeTypeName + '_' + chunkIdx,
      fileFormat: 'SHP',
      folder: 'RiskIncidence_' + changeTypeName.toUpperCase()
    });
  }
});
