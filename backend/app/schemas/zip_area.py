"""Response models aligned with Milestone 3 ZIP-level queries."""

from pydantic import BaseModel, Field


class ZipAreaCard(BaseModel):
    """One row from Query 1 / 2 / 3 / 4 style searches (ZIP aggregate)."""

    id: str = Field(..., description="Same as zip_code for routing")
    zip_code: str
    city: str | None = None
    state: str | None = None
    avg_housing_price: float | None = None
    total_income: float | None = None
    num_schools: int | None = None
    avg_school_enrollment: float | None = None
    income_price_ratio: float | None = None
    avg_price_per_sqft: float | None = Field(
        None, description="Populated for value-vs-national style results when applicable"
    )
    thumb_url: str | None = None


class ZipSearchResponse(BaseModel):
    items: list[ZipAreaCard]
    total: int
    limit: int
    offset: int
    search_mode: str = Field(..., description="Which Milestone 3 query family was used")


class HousingSummary(BaseModel):
    zip_code: str
    avg_housing_price: float | None = None
    avg_house_size: float | None = None
    avg_bedrooms: float | None = None
    avg_bathrooms: float | None = None


class EducationSummary(BaseModel):
    zip_code: str
    total_schools: int | None = None
    avg_school_enrollment: float | None = None


class IrsTotals(BaseModel):
    zip_code: str
    total_income: float | None = None
    total_wage_income: float | None = None
    total_interest_income: float | None = None
    total_dividend_income: float | None = None
    total_capital_gain: float | None = None


class IrsBracketRow(BaseModel):
    zip_code: str
    income_bracket: str | None = None
    num_returns: int | None = None
    total_income: float | None = None
    wage_income: float | None = None
    interest_income: float | None = None
    dividend_income: float | None = None
    capital_gain: float | None = None


class ZipDetailResponse(BaseModel):
    """ZIP drill-down: combines M3 queries 7–10."""

    zip_code: str
    housing: HousingSummary | None = None
    education: EducationSummary | None = None
    irs_totals: IrsTotals | None = None
    irs_by_bracket: list[IrsBracketRow] = Field(default_factory=list)
