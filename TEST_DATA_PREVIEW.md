# Test Data Preview

## Files Created for E2E Testing

### 1. sales_data.csv

**Structure:**
- **Rows:** 12
- **Columns:** 6 (Date, Region, Product, Revenue, Units_Sold, Customer_Type)
- **Time Period:** January - March 2024

**Sample Data:**
```
Date,Region,Product,Revenue,Units_Sold,Customer_Type
2024-01-15,West,Widget A,125000,500,Enterprise
2024-01-20,East,Widget B,98000,350,Mid-Market
2024-01-25,West,Widget A,145000,580,Enterprise
2024-02-01,South,Widget C,75000,300,Small Business
...
```

**Key Insights Expected:**
- West region has highest revenue
- Widget A is the top product
- Enterprise customers generate most revenue
- Revenue trend: Growing from Jan to Mar

**Expected Charts:**
1. Revenue Over Time (Line) - Shows growth trend
2. Revenue by Region (Bar) - West dominates
3. Revenue by Product (Bar) - Widget A leads
4. Revenue by Customer Type (Bar) - Enterprise segment

---

### 2. marketing_metrics.csv

**Structure:**
- **Rows:** 9
- **Columns:** 7 (Campaign, Channel, Impressions, Clicks, Conversions, Cost, Revenue)
- **Time Period:** Q1-Q3 campaigns

**Sample Data:**
```
Campaign,Channel,Impressions,Clicks,Conversions,Cost,Revenue
Q1 Brand Awareness,Social Media,2500000,125000,1250,45000,187500
Q1 Product Launch,Email,500000,75000,1500,5000,225000
Q1 Retargeting,Display,1800000,72000,1080,36000,162000
...
```

**Key Insights Expected:**
- Email has highest conversion rate
- Product Launch campaigns show best ROI
- Social Media has highest impressions but lower conversion
- Overall ROI: ~447%

**Expected Charts:**
1. Conversions by Channel (Bar) - Email leads
2. Revenue by Campaign (Bar) - Product Launch wins
3. ROI by Channel (Bar) - Email most efficient
4. Impressions vs Conversions (Scatter) - Efficiency analysis

---

### 3. customer_feedback.txt

**Content Type:** Qualitative text data

**Key Sections:**
- Customer Feedback Summary - Q1 2024
- Key Themes (product quality, support, pricing)
- Notable Quotes from customers
- Action Items for improvement

**Expected Processing:**
- Text will be chunked into document segments
- Used for Q&A context
- Referenced in report generation
- Provides qualitative insights alongside quantitative data

---

## Expected Dashboard Output

When both CSV files are uploaded and dashboard is generated, the system should create:

### Chart 1: Revenue Growth Trend
- **Type:** Line Chart
- **Data:** Revenue over Date from sales_data.csv
- **Insight:** "Revenue increased 23% from January to March, with strongest growth in Q1"

### Chart 2: Regional Performance
- **Type:** Bar Chart
- **Data:** Revenue by Region
- **Insight:** "West region accounts for 42% of total revenue, indicating strong market penetration"

### Chart 3: Product Performance
- **Type:** Bar Chart
- **Data:** Revenue by Product
- **Insight:** "Widget A generates 48% of total revenue, making it the primary revenue driver"

### Chart 4: Marketing Channel Efficiency
- **Type:** Bar Chart
- **Data:** Conversions by Channel from marketing_metrics.csv
- **Insight:** "Email channel shows 2.0% conversion rate, significantly higher than other channels"

### Chart 5: Campaign ROI
- **Type:** Bar Chart
- **Data:** Revenue/Cost ratio by Campaign
- **Insight:** "Product Launch campaigns deliver 4.5x ROI, highest among all campaign types"

---

## Expected Report Sections

### Executive Summary
- Total revenue: ~$1.38M (sales) + ~$1.97M (marketing-driven)
- Key finding: West region and Widget A are primary drivers
- Recommendation: Expand Widget A in West region, replicate email campaign success

### Key Insights
1. Sales growth is strong (23% QoQ)
2. Regional concentration risk (West = 42%)
3. Marketing efficiency varies by channel (Email > Social > Display)
4. Product mix favors Widget A (48% of revenue)

### Supporting Evidence
- 12 sales transactions analyzed
- 9 marketing campaigns tracked
- Customer feedback indicates high satisfaction
- Data covers Q1 2024 period

### Recommendations
1. **Immediate:** Expand Widget A inventory in West region
2. **Short-term:** Increase email marketing budget allocation
3. **Medium-term:** Diversify regional revenue (reduce West dependency)
4. **Long-term:** Develop Widget B to match Widget A performance

---

## Q&A Test Questions

### Question 1: "What region has the highest revenue?"
**Expected Answer:**
- **Confession:** West region has the highest revenue at approximately $542,000
- **Evidence:**
  - sales_data.csv shows West region transactions
  - 5 out of 12 transactions are from West
  - Average transaction value: $108,400
- **Caveats:**
  - Only 3 months of data
  - Sample size: 12 transactions

### Question 2: "Which marketing channel is most effective?"
**Expected Answer:**
- **Confession:** Email channel shows highest conversion rate at 2.0%
- **Evidence:**
  - marketing_metrics.csv: Email = 1,500 conversions from 75,000 clicks
  - Social Media = 1,250 conversions from 125,000 clicks (1.0%)
  - Display = 1,080 conversions from 72,000 clicks (1.5%)
- **Caveats:**
  - Different campaign types may affect conversion rates
  - Sample period: Q1-Q3 only

### Question 3: "What are the top 3 things I should know?"
**Expected Answer:**
- **Confession:**
  1. Revenue is growing 23% quarter-over-quarter
  2. West region and Widget A drive 42% and 48% of revenue respectively
  3. Email marketing shows 2x better conversion than other channels
- **Evidence:** [References to specific charts and data]
- **Caveats:** Limited to Q1 2024 data

---

## Test Execution Status

**Current Status:** ⚠️ Database Not Running

**What's Ready:**
- ✅ Test data files created
- ✅ E2E test script written
- ✅ Test scenarios defined
- ✅ Expected results documented

**What's Needed:**
- ⚠️ Start PostgreSQL database: `docker compose up -d`
- ⚠️ Run database migrations: `npx prisma db push`
- ⚠️ Seed database: `npm run db:seed`

**Once Database is Running:**
- Tests will execute automatically
- Files will be uploaded and processed
- Charts will be generated
- Reports will be created
- Q&A will be tested

---

## File Locations

- Test Data: `test-data/`
  - `sales_data.csv`
  - `marketing_metrics.csv`
  - `customer_feedback.txt`

- Test Scripts: `e2e/`
  - `full-workflow.spec.ts`

- Results: `E2E_TEST_RESULTS.md`

