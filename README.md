# Transaction Analyzer

A privacy-focused web application for analyzing your credit card or bank transactions. Upload your CSV files and get instant insights into your spending patterns.

## Features

- 📊 **Visual Analytics**: Interactive charts showing spending by category, daily trends, and distribution
- 🔒 **Privacy First**: All data processing happens locally in your browser - nothing is uploaded to any server
- 📁 **Multiple File Support**: Upload multiple CSV files at once to analyze across different time periods
- 🎨 **Beautiful UI**: Modern, responsive design with intuitive visualizations
- 📈 **Key Metrics**: Total spending, average transaction amount, top categories, and more

## What You'll See

- **Summary Cards**: Quick overview of total spending, transaction count, averages, and top category
- **Category Breakdown**: Bar chart and pie chart showing spending distribution across categories
- **Daily Spending Timeline**: Stacked bar chart showing daily spending patterns colored by category
- **Detailed Table**: Complete breakdown with amounts and percentages per category

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## CSV Format

Your CSV file should have the following columns:
- `Transaction Date` or `TransactionDate`
- `Post Date` or `PostDate`
- `Description`
- `Category`
- `Type`
- `Amount` (negative values for expenses)

Example:
```csv
Transaction Date,Post Date,Description,Category,Type,Amount
11/28/2025,11/30/2025,KROGER #273,Groceries,Sale,-41.03
11/28/2025,11/30/2025,SHELL GAS,Travel,Sale,-35.00
```

**Note**: The analyzer automatically filters out:
- Positive transactions (like credit card payments)
- Transactions without a category

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Papaparse** for CSV parsing
- **Lucide React** for icons

## Privacy & Security

🔐 **Your data never leaves your browser.** 

This application:
- Processes all data client-side using JavaScript
- Does not send any data to external servers
- Does not store any data (everything is in memory)
- When you refresh or close the page, all data is cleared

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

If you find this project helpful, please consider giving it a ⭐️ on GitHub!

---

Made with ❤️ for personal finance tracking