# TOPSIS Web Service

A web-based implementation of TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution) algorithm for multi-criteria decision analysis.

## Features

- 📁 Upload CSV or Excel (.xlsx) files
- ⚖️ Automatic TOPSIS calculation
- 📊 Results preview in browser
- 📧 Email results to user
- ⬇️ Download results as CSV
- ✅ Input validation (weights, impacts, email)
- 🎨 Modern, responsive UI
- 🚀 Deployable to Vercel

## Setup Instructions

### 1. EmailJS Configuration

To enable email functionality, you need to set up EmailJS:

1. Go to [EmailJS](https://www.emailjs.com/) and create a free account
2. Add an email service (Gmail, Outlook, etc.)
3. Create an email template with the following template variables:
   - `{{to_email}}` - Recipient email
   - `{{file_name}}` - Original filename
   - `{{results}}` - TOPSIS results preview

4. Get your credentials:
   - **Public Key**: Found in Account > API Keys
   - **Service ID**: Found in Email Services
   - **Template ID**: Found in Email Templates

5. Update `app.js` with your credentials:
   ```javascript
   // Line 4: Replace YOUR_PUBLIC_KEY
   emailjs.init('YOUR_PUBLIC_KEY');
   
   // Line 284: Replace YOUR_SERVICE_ID and YOUR_TEMPLATE_ID
   await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams);
   ```

### 2. Local Testing

1. Open `index.html` in a web browser
2. Or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   ```

### 3. Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Navigate to project directory:
   ```bash
   cd topsis-website
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow the prompts to complete deployment

## Usage

1. **Upload File**: Select a CSV or XLSX file
   - First column: Identifier (name, ID, etc.)
   - Remaining columns: Numeric criteria values

2. **Enter Weights**: Comma-separated numbers
   - Example: `1,1,1,2`
   - Must match number of criteria columns

3. **Enter Impacts**: Comma-separated + or -
   - `+` for beneficial criteria (higher is better)
   - `-` for non-beneficial criteria (lower is better)
   - Example: `+,+,-,+`

4. **Enter Email**: Valid email address to receive results

5. **Submit**: Click "Analyze & Send Results"

6. **View Results**: Preview results in browser and check email

7. **Download**: Click "Download Results" to save CSV file

## Input File Format

### Example CSV:
```csv
Model,Price,Storage,Camera,Looks
M1,250,16,12,5
M2,200,16,8,3
M3,300,32,16,4
M4,275,32,8,4
M5,225,16,16,2
```

### Requirements:
- At least 3 columns (1 identifier + 2+ criteria)
- All criteria columns must contain numeric values
- First row contains headers
- CSV or XLSX format

## Validation Rules

- ✅ Number of weights = Number of impacts = Number of criteria
- ✅ Weights must be numeric values
- ✅ Impacts must be either `+` or `-`
- ✅ All separated by commas
- ✅ Valid email format
- ✅ All criteria values must be numeric

## Technologies Used

- **HTML5** - Structure
- **CSS3** - Styling with modern gradients and animations
- **JavaScript (ES6+)** - TOPSIS algorithm implementation
- **XLSX.js** - Excel file parsing
- **EmailJS** - Email delivery service
- **Vercel** - Hosting platform

## File Structure

```
topsis-website/
├── index.html          # Main HTML page
├── styles.css          # Styling
├── app.js             # TOPSIS logic & email functionality
└── README.md          # Documentation
```

## Algorithm Steps

1. **Normalization**: Vector normalization of decision matrix
2. **Weighted Matrix**: Multiply normalized values by weights
3. **Ideal Solutions**: Calculate ideal best and worst values
4. **Distance Calculation**: Euclidean distance from ideal solutions
5. **TOPSIS Score**: Relative closeness to ideal solution
6. **Ranking**: Rank alternatives based on scores

## Troubleshooting

### Email Not Sending
- Verify EmailJS credentials are correct
- Check EmailJS dashboard for error logs
- Ensure email service is active
- Check browser console for errors

### File Upload Issues
- Ensure file is in CSV or XLSX format
- Check that all criteria values are numeric
- Verify file has at least 3 columns

### Validation Errors
- Count the number of commas in weights/impacts
- Ensure impacts only use `+` or `-` characters
- Match weights/impacts count to number of criteria columns

## License

MIT License - Free to use and modify

## Support

For issues or questions, please create an issue in the repository.
