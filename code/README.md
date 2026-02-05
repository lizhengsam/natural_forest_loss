
# 📂 Code Registry & Workflow

This directory contains the JavaScript scripts used for the analysis. The scripts are numbered sequentially (`01` to `14`) and represent the end-to-end processing pipeline.

---

## 🛠️ Phase 1: Pre-processing & Forest Baseline
*Establish the optimal data inputs and map the initial state of natural forests.*

* **`01. test_compositing_strategies.js`**
  * Evaluates and identifies the optimal multi-source data compositing strategy by benchmarking against validation datasets.
* **`02. export_canopy_data.js`**
  * Generates baseline data for forest canopy cover and canopy height for the years 2001 and 2020.
* **`03. export_natural_forest_extent.js`**
  * Integrates canopy structure and land use data to map the extent of natural forests for 2001 and 2020.
* **`04. calculate_natural_forest_area.js`**
  * Stratifies natural forests based on combinations of canopy cover and height, quantifying the area of each structural type for 2001, 2004, and 2020.

## 📉 Phase 2: Forest Dynamics & Change Detection
*Identify and quantify forest loss, expansion, and degradation.*

* **`05. export_forest_loss_extent.js`**
  * Maps forest dynamics by comparing structural data from two periods, specifically distinguishing areas of deforestation, forest expansion, and canopy structural degradation.
* **`06. calculate_forest_loss_area.js`**
  * Quantifies the specific areas undergoing deforestation, structural degradation, or expansion across different forest structural types during the study period.

## ⚠️ Phase 3: Risk Factor Analysis
*Attribute forest loss to specific natural and anthropogenic risks.*

* **`07. export_risk_factors_extent.js`**
  * Generates distribution maps for various risk factors, encompassing natural risks (drought, fire), landscape pattern risks (fragmentation), and anthropogenic disturbances.
* **`08. calculate_risk_factors_area.js`**
  * Spatially overlays forest change data with risk factor layers to quantify the loss area attributed to specific risk factors.
* **`09. estimate_loss_proportion.js`**
  * Calculates the forest loss incidence rate associated with different factors by separately analyzing “forest loss area” and “total forest area”.
* **`10. calculate_factor_coverage.js`**
  * Quantifies the explanatory coverage of the current risk model relative to total loss.

## 🌿 Phase 4: Biomass & Carbon Consequences
*Assess the ecological impact in terms of Aboveground Biomass (AGB).*

* **`11. export_stable_forest_extent.js`**
  * Exports the extent of long-term undisturbed, mature “stable forests” to serve as a reference for subsequent biomass estimation.
* **`12. estimate_biomass_baseline.js`**
  * Calculates baseline mean values and uncertainties for AGB to establish the “potential biomass level characteristic of undisturbed forests”.
* **`13. estimate_loss_consequences.js`**
  * Compares 2020 observed biomass with the potential baseline to quantify total net biomass loss.
* **`14. estimate_factor_consequences.js`**
  * Correlates biomass loss data with risk factors to calculate the amount of biomass loss attributable to specific drivers.
