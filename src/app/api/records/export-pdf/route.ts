import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all records data
    const [fishRanges, waterParams, stockingRecords, harvestRecords, feedingRecords] = await Promise.all([
      prisma.fishSizeRange.findMany({ orderBy: { minLength: 'asc' } }),
      prisma.waterParameter.findMany({ orderBy: { parameterName: 'asc' } }),
      prisma.stockingRecord.findMany({ where: { userId }, orderBy: { stockDate: 'desc' } }),
      prisma.harvestRecord.findMany({ where: { userId }, orderBy: { harvestDate: 'desc' } }),
      prisma.feedingRecord.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    ]);

    // Generate simple HTML PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Smart Fish Care - Records Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .section { margin-bottom: 30px; }
          .section h2 { color: #7c5cff; border-bottom: 2px solid #7c5cff; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #7c5cff; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">SMART FISH CARE</div>
          <h1>Records Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>

        <div class="section">
          <h2>Fish Size Ranges</h2>
          <table>
            <tr><th>Category</th><th>Length (cm)</th><th>Width (cm)</th></tr>
            ${fishRanges.map(r => `
              <tr>
                <td>${r.category}</td>
                <td>${Number(r.minLength)}${r.maxLength ? ` - ${Number(r.maxLength)}` : '+'}</td>
                <td>${Number(r.minWidth)}${r.maxWidth ? ` - ${Number(r.maxWidth)}` : '+'}</td>
              </tr>
            `).join('')}
          </table>
        </div>

        <div class="section">
          <h2>Water Parameters</h2>
          <table>
            <tr><th>Parameter</th><th>Normal Range</th><th>Danger Range</th></tr>
            ${waterParams.map(p => `
              <tr>
                <td>${p.parameterName}</td>
                <td>${Number(p.normalMin)} - ${Number(p.normalMax)} ${p.unit}</td>
                <td>${p.dangerMin || p.dangerMax ? `${p.dangerMin ? '< ' + Number(p.dangerMin) + ' ' : ''}${p.dangerMax ? '> ' + Number(p.dangerMax) : ''} ${p.unit}` : '--'}</td>
              </tr>
            `).join('')}
          </table>
        </div>

        <div class="section">
          <h2>Stocking Records (${stockingRecords.length})</h2>
          <table>
            <tr><th>Date</th><th>Fish Type</th><th>Aquarium</th><th>Quantity</th></tr>
            ${stockingRecords.map(r => `
              <tr>
                <td>${new Date(r.stockDate).toLocaleDateString()}</td>
                <td>${r.fishType}</td>
                <td>${r.aquariumNumber}</td>
                <td>${r.quantity || '--'}</td>
              </tr>
            `).join('')}
          </table>
        </div>

        <div class="section">
          <h2>Harvest Records (${harvestRecords.length})</h2>
          <table>
            <tr><th>Date</th><th>Fish Type</th><th>Quantity</th><th>Size</th><th>Weight (kg)</th></tr>
            ${harvestRecords.map(r => `
              <tr>
                <td>${new Date(r.harvestDate).toLocaleDateString()}</td>
                <td>${r.fishType}</td>
                <td>${r.quantity}</td>
                <td>${r.size}</td>
                <td>${r.weight ? Number(r.weight).toFixed(2) : '--'}</td>
              </tr>
            `).join('')}
          </table>
        </div>

        <div class="section">
          <h2>Feeding Records (${feedingRecords.length})</h2>
          <table>
            <tr><th>Date</th><th>Time</th><th>Fish Size</th><th>Food Type</th><th>Quantity</th></tr>
            ${feedingRecords.map(r => `
              <tr>
                <td>${new Date(r.createdAt).toLocaleDateString()}</td>
                <td>${r.feedingTime}</td>
                <td>${r.fishSize}</td>
                <td>${r.foodType}</td>
                <td>${r.quantity || '--'}</td>
              </tr>
            `).join('')}
          </table>
        </div>

        <div class="footer">
          <p>Smart Fish Care System - Automated Records Report</p>
        </div>
      </body>
      </html>
    `;

    // Return HTML content that can be printed as PDF
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="fish-care-report.html"',
      },
    });
  } catch (error: any) {
    console.error('PDF export error:', error);
    return NextResponse.json(
      { success: false, message: 'Error generating PDF: ' + error.message },
      { status: 500 }
    );
  }
}

