var MOD44B061 = ee.ImageCollection('MODIS/061/MOD44B'),
    MOD44B006 = ee.ImageCollection('MODIS/006/MOD44B'),
    GLOBMAPFTC = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/others/GLOBMAPFTC'),
    Grids_Val_FTC_2 = ee.FeatureCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/region/Grids_Val_FTC_2');

// define target years
var year = 2010;
var targetYears = ee.List.sequence(year - 1, year + 1);

// reproject
function resampleImg(image, fromPrj, fromScl, toScl){
  return image.reproject({crs: fromPrj, scale: fromScl})
              .reduceResolution({reducer: ee.Reducer.mean(), maxPixels: 1024})
              .reproject({crs: 'EPSG:4326', scale: toScl})
              .rename('b1')
              .toByte();
}

// load canopy cover data from MOD44B
function getModImg(year) {
  var startDate = ee.Date.fromYMD(year, 1, 1);
  var endDate = startDate.advance(1, 'year');
  
  var mod44bImg_061 = MOD44B061.filterDate(startDate, endDate)
                               .select('Percent_Tree_Cover')
                               .mosaic();
  
  var tempYear = ee.Algorithms.If(ee.Number(year).eq(2021), 2020, year);
  startDate = ee.Date.fromYMD(tempYear, 1, 1);
  
  var mod44bImg_006 = MOD44B006.filterDate(startDate, endDate)
                               .select('Percent_Tree_Cover')
                               .mosaic();
  
  var latitudeMask = ee.Image.pixelLonLat()
                       .select('latitude')
                       .gt(57.5);
  var mod44bImg = mod44bImg_061.where(mod44bImg_061.eq(0).and(latitudeMask), mod44bImg_006);
  
  mod44bImg = resampleImg(mod44bImg, MOD44B061.first().projection(), 250, 250);
  return mod44bImg.set('year', year).unmask(0);
}

var mod44bImgs = targetYears.map(getModImg);
var mod44bCol = ee.ImageCollection.fromImages(mod44bImgs);

// load canopy cover data from GLOBMAP
function getGlbImg(year) {
  var startDate = ee.Date.fromYMD(year, 1, 1);
  var endDate = startDate.advance(1, 'year');
  
  var globmapImg = GLOBMAPFTC.filterDate(startDate, endDate)
                             .mosaic();
  
  globmapImg = resampleImg(globmapImg, GLOBMAPFTC.first().projection(), 250, 250);
  return globmapImg.set('year', year).unmask(0);
}

var globmapImgs = targetYears.map(getGlbImg);
var globmapCol = ee.ImageCollection.fromImages(globmapImgs);

// combine multi-source canopy data
var canopyCvrCol = mod44bCol.merge(globmapCol);

// raw data
var mod44bRawImg = mod44bCol.filter(ee.Filter.eq('year', year))
                            .first()
                            .rename('base_mod');

var globmapRawImg = globmapCol.filter(ee.Filter.eq('year', year))
                              .first()
                              .rename('base_gmf');

//mean composition 
var mod44bMeanImg = mod44bCol.mean().rename('mean_mod');
var globmapMeanImg = globmapCol.mean().rename('mean_gmf');

var allMeanImg = canopyCvrCol.mean().rename('mean_all');

// percentile composition
var percentNums = ee.List.sequence(0, 100, 10);
var percentImg = canopyCvrCol.reduce(ee.Reducer.percentile(percentNums))
                             .regexpRename('^.*_p', 'ap');

// interval mean composition
var intervalNums = ee.List.sequence(10, 90, 10);
var intervalImgs = intervalNums.map(function(l) {
  var lNum = ee.Number(l);
  var fNum = ee.Number(100).subtract(lNum);
  var tempItvNums = ee.List.sequence(0, fNum, 10);
  
  return tempItvNums.map(function(i) {
    var iNum = ee.Number(i);
    var finalItvImg = canopyCvrCol.reduce(ee.Reducer.intervalMean(iNum, iNum.add(lNum)));
    
    return finalItvImg.rename(ee.String('am').cat(iNum.int()).cat('_').cat(iNum.add(lNum).int()));
  });
}).flatten();

var intervalCol = ee.ImageCollection.fromImages(intervalImgs);
var intervalImg = intervalCol.toBands().regexpRename('^\\d+_', '');

// canopy cover from GladGLCLU
var tempYear = year;
if (year == 2001) {tempYear = 2000}

var lcluImg_1 = ee.Image('projects/glad/GLCLU2020/v2/LCLUC_' + tempYear);
var treeLbls_1 = ee.List.sequence(25, 48).cat(ee.List.sequence(125, 148));
var toVlus_1 = ee.List.repeat(1, treeLbls_1.length());

var treeMask_1 = lcluImg_1.remap(treeLbls_1, toVlus_1, 0)
                          .multiply(100);

var canopyCvrImg_LCLU1 = resampleImg(treeMask_1, lcluImg_1.projection(), 30, 250);
canopyCvrImg_LCLU1 = canopyCvrImg_LCLU1.rename('gladlcluc');

// canopy cover from GLCFCS30D
var lcluCol_2 = ee.ImageCollection('projects/sat-io/open-datasets/GLC-FCS30D/annual');
var bandName_2 = 'b' + (year - 1999);
var lulcImg_2 = lcluCol_2.mosaic().select(bandName_2);

var treeMask_2 = lulcImg_2.expression('i > 50 && i < 93', {i: lulcImg_2}).multiply(100);

var canopyCvrImg_LCLU2 = resampleImg(treeMask_2, lcluCol_2.first().projection(), 30, 250);
canopyCvrImg_LCLU2 = canopyCvrImg_LCLU2.rename('glcfcs30d');

// cat all images into a multi-band image
var stackImg = ee.Image.cat([mod44bRawImg, globmapRawImg, 
                             mod44bMeanImg, globmapMeanImg, allMeanImg, 
                             percentImg, intervalImg, 
                             canopyCvrImg_LCLU1, canopyCvrImg_LCLU2]);
print(stackImg);

// define reducers for calculations
var meanRdc = ee.Reducer.mean().forEachBand(stackImg);

// export
var reducedRsl = stackImg.reduceRegions({
    collection: Grids_Val_FTC_2,
    reducer: meanRdc,
    scale: 250,
    tileScale: 4
  });

Export.table.toDrive({
    collection: reducedRsl,
    description: 'validation_ftc_' + year,
    fileNamePrefix: 'validation_ftc_' + year,
    fileFormat: 'SHP',
    folder: 'Validation_FTC_' + year
  });
