var CanopyCover = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/CanopyCover'),
    CanopyHeight = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/CanopyHeight'),
    CanopyUse = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/CanopyUse'),
    ForestExtent = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/ForestExtent'),
    HRSPEI = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/others/HRSPEI'),
    BurnedArea_1 = ee.ImageCollection('ESA/CCI/FireCCI/5_1'),
    BurnedArea_2 = ee.ImageCollection('MODIS/061/MCD64A1'),
    BurnedArea_3 = ee.ImageCollection('projects/sat-io/open-datasets/GABAM'),
    BurnedArea_4 = ee.ImageCollection('users/sashatyu/2001-2023_fire_forest_loss_annual');

var riskVis_1 = {
  min: 0,
  max: 1,
  palette: ['f0f0f0', 'f00c0c']
};

var riskVis_2 = {
  min: 0,
  max: 4,
  palette: ['f0f0f0', 'f00c0c']
};

// load canopy cover data and create masks
var canopyCvrImg_2001 = CanopyCover.filterDate('2001-1-1', '2002-1-1').first();
var canopyCvrImg_2020 = CanopyCover.filterDate('2020-1-1', '2021-1-1').first();

var canopyCvrMask_2001_1 = canopyCvrImg_2001.gt(10);
var canopyCvrChgVlu = canopyCvrImg_2020.subtract(canopyCvrImg_2001);
var canopyCvrMask_2001_2 = canopyCvrImg_2001.gt(2.5).and(canopyCvrChgVlu.gt(2.5));
var canopyCvrMask_2001 = canopyCvrMask_2001_1.or(canopyCvrMask_2001_2);

var canopyCvrMask_2020_1 = canopyCvrImg_2020.gt(10);
var canopyCvrMask_2020_2 = canopyCvrImg_2020.gt(5).and(canopyCvrMask_2001);
var canopyCvrMask_2020 = canopyCvrMask_2020_1.or(canopyCvrMask_2020_2);

// load canopy height data and create masks
var canopyHgtImg_2001 = CanopyHeight.filterDate('2001-1-1', '2002-1-1').first();
var canopyHgtImg_2020 = CanopyHeight.filterDate('2020-1-1', '2021-1-1').first();

var canopyHgtChgVlu = canopyHgtImg_2020.subtract(canopyHgtImg_2001);
var canopyHgtMask_2001_1 = canopyHgtImg_2001.gt(5);
var canopyHgtMask_2001_2 = canopyHgtImg_2001.gt(1.25).and(canopyHgtChgVlu.gt(1.25));
var canopyHgtMask_2001 = canopyHgtMask_2001_1.or(canopyHgtMask_2001_2);

var canopyHgtMask_2020_1 = canopyHgtImg_2020.gt(5);
var canopyHgtMask_2020_2 = canopyHgtImg_2020.gt(2.5).and(canopyHgtMask_2001);
var canopyHgtMask_2020 = canopyHgtMask_2020_1.or(canopyHgtMask_2020_2);

// create final canopy masks
var canopyMask_2001 = canopyCvrMask_2001.and(canopyHgtMask_2001);
var canopyMask_2020 = canopyCvrMask_2020.and(canopyHgtMask_2020);

// load canopy use data and create masks
var canopyUseImg_2001 = CanopyUse.filterDate('2001-1-1', '2002-1-1').first();
var canopyUseImg_2020 = CanopyUse.filterDate('2020-1-1', '2021-1-1').first();

// load forest extent data
var forestExtMask_2001 = ForestExtent.filterDate('2001-1-1', '2002-1-1').first();
var forestExtMask_2020 = ForestExtent.filterDate('2020-1-1', '2021-1-1').first();

// reproject
function resampleImg(image, fromPrj, fromScl, toScl){
  return image.reproject({crs: fromPrj, scale: fromScl})
              .reduceResolution({reducer: ee.Reducer.mean(), maxPixels: 1024})
              .reproject({crs: 'EPSG:4326', scale: toScl})
              .rename('b1');
}

// export
function exportImg(image, fileName, scale, folderName) {
  Export.image.toDrive({
    image: image,
    description: fileName,
    fileNamePrefix: fileName,
    scale: scale,
    crs: 'EPSG:4326',
    folder: folderName,
    maxPixels: 1e13
  });
}

// drought
var longSpeiCol = HRSPEI.filterDate('1981-1-1', '2020-1-1');
var nowSpeiCol = HRSPEI.filterDate('2001-1-1', '2020-1-1');
var normalSpeiImg = longSpeiCol.reduce(ee.Reducer.intervalMean(50, 70));
var lowSpeiImg = nowSpeiCol.reduce(ee.Reducer.intervalMean(0, 20));

var droughtExtMask = lowSpeiImg.subtract(normalSpeiImg)
                               .lte(-2)
                               .unmask(0);
Map.addLayer(droughtExtMask, riskVis_1, 'Drought', false);

droughtExtMask = resampleImg(droughtExtMask, HRSPEI.first().projection(), 5000, 1000);
droughtExtMask = droughtExtMask.gt(0);
exportImg(droughtExtMask, 'drought', 1000, 'RiskExtent');

// fire
var fireExtCol_1 = BurnedArea_1.filterDate('2000-12-31', '2021-1-1');
var fireExtImg_1 = fireExtCol_1.select('ConfidenceLevel').max();
var fireExtMask_1 = fireExtImg_1.gte(50).unmask(0);

var fireExtCol_2 = BurnedArea_2.filterDate('2000-12-31', '2021-1-1');
var fireExtImg_2 = fireExtCol_2.select('BurnDate').max();
var fireExtMask_2 = fireExtImg_2.gt(0).unmask(0);

var fireExtCol_3 = BurnedArea_3.filterDate('2000-12-31', '2021-1-1');
var fireExtImg_3 = fireExtCol_3.max();
var fireExtMask_3 = fireExtImg_3.gt(0).unmask(0);

var fireExtImg_4 = BurnedArea_4.max();
var fireExtMask_4 = fireExtImg_4.expression('i > 0 && i < 21', {i: fireExtImg_4}).unmask(0);

var fireExtMask = fireExtMask_1.and(fireExtMask_2)
                               .and(fireExtMask_3)
                               .or(fireExtMask_4);
Map.addLayer(fireExtMask, riskVis_1, 'Fire', false);

fireExtMask = resampleImg(fireExtMask, BurnedArea_4.first().projection(), 30, 250);
fireExtMask = fireExtMask.gte(0.5);
exportImg(fireExtMask, 'fire', 250, 'RiskExtent');

// fragmentation
var allFrsExtMask = forestExtMask_2001.or(canopyUseImg_2001.lte(6)
                                                           .and(canopyUseImg_2001.gt(2))
                                                           .and(canopyMask_2001));
var coreFrsExtMask_1 = allFrsExtMask.convolve(ee.Kernel.square({radius: 1.5, units: 'pixels', normalize: true}));
coreFrsExtMask_1 = coreFrsExtMask_1.gte(0.5);

var patchExtMask = allFrsExtMask.subtract(coreFrsExtMask_1).gt(0);

// edge 0-500 m
var coreFrsExtMask_2 = coreFrsExtMask_1.focalMin({kernel: ee.Kernel.circle({radius: 2}), iterations: 1});
var edgeExtMask_1 = coreFrsExtMask_1.subtract(coreFrsExtMask_2).gt(0);

// edge 500-1000 m
var coreFrsExtMask_3 = coreFrsExtMask_1.focalMin({kernel: ee.Kernel.circle({radius: 4}), iterations: 1});
var edgeExtMask_2 = coreFrsExtMask_1.subtract(coreFrsExtMask_3).gt(0);

// edge 1000-1500 m
var coreFrsExtMask_4 = coreFrsExtMask_1.focalMin({kernel: ee.Kernel.circle({radius: 6}), iterations: 1});
var edgeExtMask_3 = coreFrsExtMask_1.subtract(coreFrsExtMask_4).gt(0);

var edgeExtMask = ee.Image(0)
                    .where(edgeExtMask_3, 4)  // 4 edge 1000-1500 m
                    .where(edgeExtMask_2, 3)  // 3 edge 500-1000 m
                    .where(edgeExtMask_1, 2)  // 2 edge 0-500 m
                    .where(patchExtMask, 1);  // 1 fragmentation
Map.addLayer(edgeExtMask, riskVis_2, 'Edge ', false);

edgeExtMask = resampleImg(edgeExtMask, forestExtMask_2001.projection(), 250, 250);
exportImg(edgeExtMask, 'edge', 250, 'RiskExtent');

// human management and modification
function getHumExtMask(startStaMask, endStaMask, layerName, fileName) {
  var finalMask = startStaMask.and(endStaMask).unmask(0);
  Map.addLayer(finalMask, riskVis_1, layerName, false);
  
  finalMask = resampleImg(finalMask, canopyUseImg_2001.projection(), 250, 250);
  finalMask = finalMask.gt(0);
  exportImg(finalMask, fileName, 250, 'RiskExtent');
}

// management
var startStaMask_0 = canopyUseImg_2001.eq(1).and(forestExtMask_2001);
var endStaMask_0 = canopyUseImg_2020.eq(2).and(forestExtMask_2020);

getHumExtMask(startStaMask_0, endStaMask_0, 'Human Management', 'management');

// modification 1
var startStaMask_1 = forestExtMask_2001;
var endStaMask_1 = canopyUseImg_2020.remap([3, 4], [1, 1], 0)
                                    .and(canopyMask_2020.eq(1));

getHumExtMask(startStaMask_1, endStaMask_1, 'Human Modification 1', 'modification_1');

// modification 2
var startStaMask_2 = forestExtMask_2001;
var endStaMask_2 = canopyUseImg_2020.remap([5, 6], [1, 1], 0)
                                    .and(canopyMask_2020.eq(1));

getHumExtMask(startStaMask_2, endStaMask_2, 'Human Modification 2', 'modification_2');

// modification 3
var startStaMask_3 = forestExtMask_2001;
var endStaMask_3 = canopyMask_2020.eq(0);

var endStaTempCol_3_1 = CanopyUse.filterDate('2002-01-01', '2020-01-01');
endStaTempCol_3_1 = endStaTempCol_3_1.map(function(image) {return image.gte(3).and(image.lte(6))});
var endStaTempMask_3_1 = endStaTempCol_3_1.max().gt(0);
var endStaTempCol_3_2 = ee.ImageCollection('CSP/HM/GlobalHumanModification');
var endStaTempMask_3_2 = endStaTempCol_3_2.first().gt(0.4);
var endStaTempMask_3_3 = ee.Image('projects/ee-lizhengsam/assets/Stage-B/Exp-A/others/MiningArea').gt(0);

var endStaTempMask_3 = endStaTempMask_3_1.or(endStaTempMask_3_2).or(endStaTempMask_3_3);
endStaMask_3 = endStaMask_3.and(endStaTempMask_3);

getHumExtMask(startStaMask_3, endStaMask_3, 'Human Modification 3', 'modification_3');
