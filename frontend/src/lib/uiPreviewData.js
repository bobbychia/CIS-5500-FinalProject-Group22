export const previewAreas = [
  {
    id: "preview-19103",
    zip_code: "19103",
    city: "Philadelphia",
    state: "PA",
    thumb_url:
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
    avg_housing_price: 845000,
    avg_price_per_sqft: 492,
    avg_bedrooms: 3.2,
    avg_bathrooms: 2.4,
    avg_house_size: 1810,
    num_schools: 11,
    income_price_ratio: 1.83,
    total_income: 138000000,
    avg_school_enrollment: 612,
  },
  {
    id: "preview-19146",
    zip_code: "19146",
    city: "Philadelphia",
    state: "PA",
    thumb_url:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    avg_housing_price: 612000,
    avg_price_per_sqft: 358,
    avg_bedrooms: 2.8,
    avg_bathrooms: 2.1,
    avg_house_size: 1650,
    num_schools: 8,
    income_price_ratio: 2.06,
    total_income: 102000000,
    avg_school_enrollment: 554,
  },
  {
    id: "preview-19406",
    zip_code: "19406",
    city: "King of Prussia",
    state: "PA",
    thumb_url:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    avg_housing_price: 728000,
    avg_price_per_sqft: 402,
    avg_bedrooms: 3.6,
    avg_bathrooms: 2.8,
    avg_house_size: 2140,
    num_schools: 10,
    income_price_ratio: 2.14,
    total_income: 164000000,
    avg_school_enrollment: 683,
  },
  {
    id: "preview-19087",
    zip_code: "19087",
    city: "Wayne",
    state: "PA",
    thumb_url:
      "https://images.unsplash.com/photo-1600607687644-c7f34b5f0f8b?auto=format&fit=crop&w=1200&q=80",
    avg_housing_price: 1190000,
    avg_price_per_sqft: 525,
    avg_bedrooms: 4.3,
    avg_bathrooms: 3.5,
    avg_house_size: 2980,
    num_schools: 12,
    income_price_ratio: 2.41,
    total_income: 246000000,
    avg_school_enrollment: 702,
  },
  {
    id: "preview-10011",
    zip_code: "10011",
    city: "New York",
    state: "NY",
    thumb_url:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
    avg_housing_price: 1690000,
    avg_price_per_sqft: 1180,
    avg_bedrooms: 2.2,
    avg_bathrooms: 2.0,
    avg_house_size: 1320,
    num_schools: 14,
    income_price_ratio: 1.58,
    total_income: 321000000,
    avg_school_enrollment: 735,
  },
  {
    id: "preview-94107",
    zip_code: "94107",
    city: "San Francisco",
    state: "CA",
    thumb_url:
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80",
    avg_housing_price: 1425000,
    avg_price_per_sqft: 1015,
    avg_bedrooms: 2.7,
    avg_bathrooms: 2.2,
    avg_house_size: 1485,
    num_schools: 9,
    income_price_ratio: 1.92,
    total_income: 278000000,
    avg_school_enrollment: 641,
  },
];

export const previewResponse = {
  items: previewAreas,
  total: previewAreas.length,
  search_mode: "explore",
};

export function getPreviewDetail(zipCode) {
  const base =
    previewAreas.find((item) => item.zip_code === zipCode) ?? previewAreas[0];

  return {
    zip_code: base.zip_code,
    city: base.city,
    state: base.state,
    hero_url: base.thumb_url,
    housing: {
      avg_housing_price: base.avg_housing_price,
      avg_house_size: base.avg_house_size,
      avg_bedrooms: base.avg_bedrooms,
      avg_bathrooms: base.avg_bathrooms,
    },
    education: {
      total_schools: base.num_schools,
      avg_school_enrollment: base.avg_school_enrollment,
    },
    irs_totals: {
      total_income: base.total_income,
      total_wage_income: Math.round(base.total_income * 0.72),
      total_interest_income: Math.round(base.total_income * 0.05),
      total_dividend_income: Math.round(base.total_income * 0.08),
      total_capital_gain: Math.round(base.total_income * 0.15),
    },
    irs_by_bracket: [
      {
        income_bracket: "$0 - $25k",
        num_returns: 185,
        total_income: 3200000,
      },
      {
        income_bracket: "$25k - $75k",
        num_returns: 410,
        total_income: 18800000,
      },
      {
        income_bracket: "$75k - $200k",
        num_returns: 528,
        total_income: 59400000,
      },
      {
        income_bracket: "$200k+",
        num_returns: 194,
        total_income: Math.round(base.total_income * 0.46),
      },
    ],
  };
}
