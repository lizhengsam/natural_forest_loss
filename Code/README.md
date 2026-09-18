# Analysis code

This directory contains the JS scripts used for the geospatial processing.

## Phase 1: Pre-processing & forest baseline
*establish the optimal data inputs and map the initial state of natural forests.*

<table width="100%">
<thead><tr><th width="30%" align="left">script</th><th width="70%" align="left">description</th></tr></thead>
<tbody>
<tr><td><a href="01_test_compositing_strategies">01_<wbr>test_<wbr>compositing_<wbr>strategies</a></td><td>evaluates and identifies the optimal multi-source data compositing strategy by benchmarking against validation datasets.</td></tr>
<tr><td><a href="02_export_canopy_data">02_<wbr>export_<wbr>canopy_<wbr>data</a></td><td>generates baseline data for forest canopy cover and canopy height for the years 2001 and 2020.</td></tr>
<tr><td><a href="03_export_natural_forest_extent">03_<wbr>export_<wbr>natural_<wbr>forest_<wbr>extent</a></td><td>integrates canopy structure and land use data to map the extent of natural forests for 2001 and 2020.</td></tr>
<tr><td><a href="04_calculate_natural_forest_area">04_<wbr>calculate_<wbr>natural_<wbr>forest_<wbr>area</a></td><td>stratifies natural forests based on combinations of canopy cover and height, quantifying the area of each structural type for 2001, 2004, and 2020.</td></tr>
</tbody>
</table>

## Phase 2: Forest dynamics & change detection
*identify and quantify forest deforestation, expansion, and degradation.*

<table width="100%">
<thead><tr><th width="30%" align="left">script</th><th width="70%" align="left">description</th></tr></thead>
<tbody>
<tr><td><a href="05_export_forest_loss_extent">05_<wbr>export_<wbr>forest_<wbr>loss_<wbr>extent</a></td><td>maps forest dynamics by comparing structural data from two periods, specifically distinguishing areas of deforestation, forest expansion, and canopy structural degradation.</td></tr>
<tr><td><a href="06_calculate_forest_loss_area">06_<wbr>calculate_<wbr>forest_<wbr>loss_<wbr>area</a></td><td>quantifies the specific areas undergoing deforestation, structural degradation, or expansion across different forest structural types during the study period.</td></tr>
</tbody>
</table>

## Phase 3: Biomass baseline
*establish reference biomass levels from stable forests.*

<table width="100%">
<thead><tr><th width="30%" align="left">script</th><th width="70%" align="left">description</th></tr></thead>
<tbody>
<tr><td><a href="07_export_stable_forest_extent">07_<wbr>export_<wbr>stable_<wbr>forest_<wbr>extent</a></td><td>exports the extent of operationally defined stable forests to serve as a reference for subsequent biomass estimation.</td></tr>
<tr><td><a href="08_estimate_biomass_baseline">08_<wbr>estimate_<wbr>biomass_<wbr>baseline</a></td><td>calculates baseline mean values and uncertainties for AGB to establish the “potential biomass level characteristic of undisturbed forests”.</td></tr>
</tbody>
</table>

## Phase 4: Risk factor analysis
*quantify spatial overlap between forest loss and mapped natural and anthropogenic risk factors.*

<table width="100%">
<thead><tr><th width="30%" align="left">script</th><th width="70%" align="left">description</th></tr></thead>
<tbody>
<tr><td><a href="09_export_risk_factors_extent">09_<wbr>export_<wbr>risk_<wbr>factors_<wbr>extent</a></td><td>generates distribution maps for various risk factors, encompassing natural risks (drought, fire), landscape pattern risks (fragmentation, edge proximity), and anthropogenic disturbances.</td></tr>
<tr><td><a href="10_calculate_risk_factors_area">10_<wbr>calculate_<wbr>risk_<wbr>factors_<wbr>area</a></td><td>quantifies forest loss areas overlapping mapped factors using three measures: exclusive overlap, full overlap, and equal allocation among co-occurring factors.</td></tr>
<tr><td><a href="11_estimate_loss_proportion">11_<wbr>estimate_<wbr>loss_<wbr>proportion</a></td><td>exports factor-exposed forest loss area and total factor-exposed forest area as the numerator and denominator for calculating loss proportions.</td></tr>
<tr><td><a href="12_calculate_factor_coverage">12_<wbr>calculate_<wbr>factor_<wbr>coverage</a></td><td>exports loss areas overlapping at least one mapped factor and total loss areas for calculating descriptive spatial coverage.</td></tr>
</tbody>
</table>

## Phase 5: Biomass consequences
*assess the ecological impact in terms of Aboveground Biomass (AGB).*

<table width="100%">
<thead><tr><th width="30%" align="left">script</th><th width="70%" align="left">description</th></tr></thead>
<tbody>
<tr><td><a href="13_estimate_loss_consequences">13_<wbr>estimate_<wbr>loss_<wbr>consequences</a></td><td>compares 2020 observed biomass with the potential baseline to quantify total net biomass loss.</td></tr>
<tr><td><a href="14_estimate_factor_consequences">14_<wbr>estimate_<wbr>factor_<wbr>consequences</a></td><td>quantifies modeled AGB deficits overlapping mapped risk factors.</td></tr>
</tbody>
</table>
