# SKU Strategy for Complex Fabric Kits

This diagram uses the entity-relationship style (erDiagram) to clearly show how multiple inventory SKUs link to the final sellable product (the Kit), illustrating the necessity of the multi-SKU strategy.

```mermaid
erDiagram
    FULL_BOLT {
        string SKU
        string Unit_of_Measure
    }

    PRE_CUT_YARD {
        string SKU
        string Unit_of_Measure
    }

    PRE_CUT_FQ {
        string SKU
        string Unit_of_Measure
    }
    
    PATTERN {
        string SKU
    }

    SELLABLE_KIT {
        string SKU
    }

    KIT_RECIPE {
        string recipe_id
    }

    QSIM_LOGIC_ENGINE {
        string engine_id
    }
    
    FULL_BOLT ||--o{ PRE_CUT_YARD : is_source_of
    FULL_BOLT ||--o{ PRE_CUT_FQ : is_source_of

    KIT_RECIPE ||--|{ PRE_CUT_YARD : requires
    KIT_RECIPE ||--|{ PRE_CUT_FQ : requires
    KIT_RECIPE ||--|{ PATTERN : requires

    SELLABLE_KIT ||--|{ KIT_RECIPE : defines_components

    QSIM_LOGIC_ENGINE --o FULL_BOLT : Deducts_Directly_From
    QSIM_LOGIC_ENGINE --o SELLABLE_KIT : Monitors_Availability_Of
```