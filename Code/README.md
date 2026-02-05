# Code for "A pervasive but uneven loss of global natural forests under multi-risk exposures"

### test_compositing_strategies.js 
Evaluates and identifies the optimal multi-source data compositing strategy by benchmarking against validation datasets.

### export_canopy_data.js 
Generates baseline data for forest canopy cover and canopy height for the years 2001 and 2020.

### export_natural_forest_extent.js 
Integrates canopy structure and land use data to map the extent of natural forests for 2001 and 2020.

### calculate_natural_forest_area.js 
Stratifies natural forests based on combinations of canopy cover and height, quantifying the area of each structural type for 2001, 2004, and 2020.

### export_forest_loss_extent.js 
Maps forest dynamics by comparing structural data from two periods, specifically distinguishing areas of deforestation, forest expansion, and canopy structural degradation.

### calculate_forest_loss_area.js 
Quantifies the specific areas undergoing deforestation, structural degradation, or expansion across different forest structural types during the study period.

### export_risk_factors_extent.js 
Generates distribution maps for various risk factors affecting forests, encompassing natural risks (drought, fire), landscape pattern risks (fragmentation, edge effects), and anthropogenic disturbance risks (management and modification).

### calculate_risk_factors_area.js 
Spatially overlays forest change data with risk factor layers to quantify the loss area attributed to specific risk factors within different natural forest structural types.

### estimate_loss_proportion.js 
Separately calculates “forest loss area” and “total forest area” within the scope of each risk factor to derive the forest loss incidence rate associated with different factors.

### calculate_factor_coverage.js 
Calculates the proportion of forest loss occurring within identified risk factor ranges relative to total loss, aiming to quantify the explanatory coverage of the current risk model regarding overall forest destruction.

### export_stable_forest_extent.js 
Exports the extent of long-term undisturbed, mature “stable forests” to serve as a reference for subsequent biomass estimation.

### estimate_biomass_baseline.js 
Calculates baseline mean values and uncertainties for forest Aboveground Biomass (AGB) across multi-scale grids to establish the “potential biomass level characteristic of undisturbed forests”.

### estimate_loss_consequences.js 
Compares 2020 observed biomass with the potential baseline biomass to quantify the total net biomass loss resulting from deforestation and degradation.

### estimate_factor_consequences.js 
Correlates biomass loss data with risk factor distributions to calculate the amount of biomass loss attributable to specific risk factors.
