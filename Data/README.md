# Example data

Example shapefile outputs from the Google Earth Engine analysis of natural forest loss.

## Software

The shapefiles can be processed with ArcGIS, QGIS, ENVI, GDAL, or GEE.

## Meaning of abbreviations in general categories

### 01 Forest Change

<table width="100%">
<thead>
<tr>
<th width="1000" align="left">code</th>
<th width="3000" align="left">category</th>
<th width="6000" align="left">definition</th>
</tr>
</thead>
<tbody>
<tr><td>def</td><td>deforestation</td><td>loss of natural forest status</td></tr>
<tr><td>deg</td><td>structural degradation</td><td>concurrent reductions in canopy cover and height</td></tr>
<tr><td>degc</td><td>canopy cover degradation</td><td>degradation identified from canopy cover reduction</td></tr>
<tr><td>degh</td><td>canopy height degradation</td><td>degradation identified from canopy height reduction</td></tr>
</tbody>
</table>

### 02 Forest Structure

<table width="100%">
<thead>
<tr>
<th width="2500" align="left">forest structure</th>
<th width="2500" align="center">structure code</th>
<th width="2500" align="center">deforestation</th>
<th width="2500" align="center">degradation</th>
</tr>
</thead>
<tbody>
<tr><td>closed high</td><td align="center">ch</td><td align="center">fch</td><td align="center">gch</td></tr>
<tr><td>closed low</td><td align="center">cl</td><td align="center">fcl</td><td align="center">gcl</td></tr>
<tr><td>open high</td><td align="center">oh</td><td align="center">foh</td><td align="center">goh</td></tr>
<tr><td>open low</td><td align="center">ol</td><td align="center">fol</td><td align="center">gol</td></tr>
</tbody>
</table>

*Note: Each code combines a change type (**f** for deforestation or **g** for degradation) with a forest structure.*