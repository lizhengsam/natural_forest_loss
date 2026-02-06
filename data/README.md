# data registry & dictionary

This directory contains the dataset descriptions and variable definitions used in the analysis. All data formats are standardized for compatibility with major geospatial platforms.

---

## 🌍 Data Origin & Compatibility
*Information regarding data generation sources and supported software environments.*

* **Source Origin**
  * All the data in this paper comes from the shapefiles obtained by running the Google Earth Engine (GEE) scripts provided in the `code/` directory.
* **Software Support**
  * The shapefiles are compatible with standard geographic information and remote sensing software, programming packages, and cloud platforms such as ArcGIS, QGIS, ENVI, GDAL, and GEE.

## 🌲 Dictionary: Specific Structure Changes
*Codes denoting changes in specific forest structural types (High/Low, Closed/Open).*

* **`fch`**
  * Deforestation of closed high forests.
* **`fcl`**
  * Deforestation of closed low forests.
* **`foh`**
  * Deforestation of open high forests.
* **`fol`**
  * Deforestation of open low forests.
* **`gch`**
  * Degradation of closed high forests.
* **`gcl`**
  * Degradation of closed low forests.
* **`goh`**
  * Degradation of open high forests.
* **`gol`**
  * Degradation of open low forests.

## 🏷️ Dictionary: General Categories
*Broad classification of forest change mechanisms and types.*

* **`def`**
  * Deforestation (Complete loss of forest cover).
* **`deg`**
  * Degradation (Reduction in forest quality).
* **`degc`**
  * Degradation of canopy cover.
* **`degh`**
  * Degradation of canopy height.
