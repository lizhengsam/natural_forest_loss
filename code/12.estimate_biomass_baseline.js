var ESACCIAGB = ee.ImageCollection('projects/sat-io/open-datasets/ESA/ESA_CCI_AGB'),
    ForestExtent = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/ForestExtent'),
    Grids_HEX_05 = ee.FeatureCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/region/Grids_HEX_05'),
    Grids_HEX_10 = ee.FeatureCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/region/Grids_HEX_10'),
    Grids_HEX_15 = ee.FeatureCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/region/Grids_HEX_15'),
    Grids_HEX_20 = ee.FeatureCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/region/Grids_HEX_20'),
    Grids_HEX_25 = ee.FeatureCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/region/Grids_HEX_25'),
    Grids_HEX_30 = ee.FeatureCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/region/Grids_HEX_30'),
    Grids_HEX_35 = ee.FeatureCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/region/Grids_HEX_35'),
    Grids_HEX_40 = ee.FeatureCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/region/Grids_HEX_40'),
    Grids_HEX_45 = ee.FeatureCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/region/Grids_HEX_45'),
    Grids_HEX_50 = ee.FeatureCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/region/Grids_HEX_50');

var forestAgbVis = {
  min: 1, 
  max: 400, 
  palette: ['c6ecae', 'a1d490', '7cb970', '57a751', '348e32', '267a29', '176520', '0c4e15', '07320d', '031807']
};

// forest agb
var cciAgbImg_2020 = ESACCIAGB.filterDate('2020-1-1', '2021-1-1').mosaic();

// stable forest extent
var stableFrsExtMask = ForestExtent.filter(ee.Filter.eq('type', 'stable_1500')).first();

// stable forest agb and sd
var stableFrsAgbImg_2020 = cciAgbImg_2020.select(['AGB']).updateMask(stableFrsExtMask);
Map.addLayer(stableFrsAgbImg_2020, forestAgbVis, 'Forest AGB', false);

var stableFrsAgbSdImg_2020 = cciAgbImg_2020.select(['SD']).updateMask(stableFrsExtMask);

// general reduce function
function reduceImg(image, reducer, roi, scale, bandName) {
  var reducedRsl = image.reduceRegion({ 
    reducer: reducer, 
    geometry: roi, 
    scale: scale, 
    maxPixels: 10e13 
  });
  var value = reducedRsl.get(bandName);
  return ee.Number(ee.Algorithms.If(ee.Algorithms.IsEqual(value, null), 0, value));
}

// calculate grid statistics
function getGridVlu(grid) {
  var roi = grid.geometry();
  
  var pixelNum = reduceImg(stableFrsAgbImg_2020, ee.Reducer.count(), roi, 250, 'AGB');
  
  var gridVlu = ee.Algorithms.If(
    pixelNum.gt(0), 
    
    (function() {
      var trimVlu = stableFrsAgbImg_2020.reduceRegion({
        reducer: ee.Reducer.percentile([10, 90]),
        geometry: roi,
        scale: 100,
        maxPixels: 10e13
      });
      
      var item_1 = trimVlu.get('AGB_p10');
      var item_2 = trimVlu.get('AGB_p90');
      
      var isItem1Null = ee.Algorithms.IsEqual(item_1, null);
      
      var eitherNull = ee.Algorithms.If(
          isItem1Null, 
          true, 
          ee.Algorithms.IsEqual(item_2, null)
      );
      
      
      return ee.Algorithms.If(
         eitherNull,
         
         grid.set({
            'stbagb': -9999,
            'pxlnum': 0
         }).copyProperties(grid),
         
         (function(){
             var lowerVlu = ee.Number(item_1);
             var upperVlu = ee.Number(item_2);
          
             var lowerMask = stableFrsAgbImg_2020.gte(lowerVlu);
             var upperMask = stableFrsAgbImg_2020.lte(upperVlu);
          
             var tempStbFrsAgbImg_2020 = stableFrsAgbImg_2020.updateMask(lowerMask.and(upperMask));
             var tempStbFrsAgbSdImg_2020 = stableFrsAgbSdImg_2020.updateMask(lowerMask.and(upperMask));
          
             var meanAgb = reduceImg(tempStbFrsAgbImg_2020, ee.Reducer.mean(), roi, 100, 'AGB');
             var spatialStd = reduceImg(tempStbFrsAgbImg_2020, ee.Reducer.stdDev(), roi, 100, 'AGB');
             var modelUnc = reduceImg(tempStbFrsAgbSdImg_2020, ee.Reducer.mean(), roi, 100, 'SD');

             var tempPxlNum = reduceImg(tempStbFrsAgbImg_2020, ee.Reducer.count(), roi, 100, 'AGB');

             var spatialSe = spatialStd.divide(tempPxlNum.sqrt());
             var totalUnc = modelUnc.pow(2)
                                    .add(spatialSe.pow(2))
                                    .sqrt();
             var relativeUnc = ee.Algorithms.If(meanAgb.gt(0), totalUnc.divide(meanAgb).multiply(100), -9999);
          
             return grid.set({
               'pxlnum': pixelNum,
               'stbagb': meanAgb,
               'sptstd': spatialStd,
               'mdlunc': modelUnc,
               'sptse': spatialSe,
               'ttlunc': totalUnc,
               'relunc': relativeUnc
             }).copyProperties(grid);
         })()
      );
    })(),
    
    grid.set({
      'stbagb': -9999,
      'pxlnum': 0
    }).copyProperties(grid)
    );
    
    return ee.Feature(gridVlu);
}

// export grid results
function exportRsl(grids, gridNum, chunkSize, alias) {
  for (var i = 0; i < Math.ceil(gridNum / chunkSize); i++) {
    var gridSubList = grids.toList(chunkSize, i * chunkSize);
    var gridSubCol = ee.FeatureCollection(gridSubList);
    var reducedRsl = gridSubCol.map(function(grid) {
      return getGridVlu(grid);
    });
    
    reducedRsl = reducedRsl.filter(ee.Filter.gt('pxlnum', 25))
                           .filter(ee.Filter.gt('stbagb', 0));
    
    Export.table.toDrive({
      collection: reducedRsl,
      description: 'forest_agb_hex_' + alias + '_' + i,
      fileNamePrefix: 'forest_agb_hex_' + alias + '_' + i,
      fileFormat: 'SHP',
      folder: 'ForestAgb_HEX_' + alias
    });
  }
}

// configuration
var gridItems = [
  {grids: Grids_HEX_05, gridNum: 57123, chunkSize: 3000, alias: '05'},
  {grids: Grids_HEX_10, gridNum: 15573, chunkSize: 1500, alias: '10'},
  {grids: Grids_HEX_15, gridNum: 7414, chunkSize: 500, alias: '15'},
  {grids: Grids_HEX_20, gridNum: 4391, chunkSize: 500, alias: '20'},
  {grids: Grids_HEX_25, gridNum: 2941, chunkSize: 500, alias: '25'},
  {grids: Grids_HEX_30, gridNum: 2140, chunkSize: 400, alias: '30'},
  {grids: Grids_HEX_35, gridNum: 1629, chunkSize: 200, alias: '35'},
  {grids: Grids_HEX_40, gridNum: 1289, chunkSize: 200, alias: '40'},
  {grids: Grids_HEX_45, gridNum: 1046, chunkSize: 200, alias: '45'},
  {grids: Grids_HEX_50, gridNum: 883, chunkSize: 200, alias: '50'}
];

// execute exports for all grid scales
gridItems.forEach(function(item) {
  exportRsl(item.grids, item.gridNum, item.chunkSize, item.alias);
});
