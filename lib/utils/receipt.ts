// Utility functions untuk print struk dan kirim WhatsApp

export interface ReceiptData {
  invoiceNumber: string
  customerName: string
  customerPhone: string
  items: Array<{
    serviceName: string
    weight: number
    pricePerKg: number
    subtotal: number
  }>
  totalAmount: number
  paidAmount: number
  remaining: number
  paymentMethod: string
  createdAt: Date
  estimatedCompletion: Date
}

/**
 * Print thermal receipt
 */
export function printReceipt(data: ReceiptData) {
  const receiptHTML = generateReceiptHTML(data)
  
  // Open print window
  const printWindow = window.open('', '_blank', 'width=300,height=600')
  if (!printWindow) {
    alert('Popup diblokir! Aktifkan popup untuk print.')
    return
  }

  printWindow.document.write(receiptHTML)
  printWindow.document.close()
  
  // Auto print
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}

/**
 * Generate HTML for thermal printer (58mm or 80mm width)
 */
function generateReceiptHTML(data: ReceiptData): string {
  const formatCurrency = (amount: number) => {
    return 'Rp ' + amount.toLocaleString('id-ID')
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Struk ${data.invoiceNumber}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Courier New', monospace;
      width: 80mm;
      padding: 10mm 5mm;
      font-size: 12px;
      line-height: 1.4;
    }
    
    .center {
      text-align: center;
    }
    
    .bold {
      font-weight: bold;
    }
    
    .header {
      text-align: center;
      margin-bottom: 10px;
      border-bottom: 1px dashed #000;
      padding-bottom: 10px;
    }
    
    .header h1 {
      font-size: 18px;
      margin-bottom: 5px;
    }
    
    .info {
      margin-bottom: 10px;
      border-bottom: 1px dashed #000;
      padding-bottom: 10px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
    }
    
    .items {
      margin-bottom: 10px;
      border-bottom: 1px dashed #000;
      padding-bottom: 10px;
    }
    
    .item {
      margin: 5px 0;
    }
    
    .item-name {
      font-weight: bold;
    }
    
    .item-detail {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
    }
    
    .summary {
      margin-bottom: 10px;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
    }
    
    .summary-row.total {
      font-weight: bold;
      font-size: 14px;
      border-top: 1px solid #000;
      padding-top: 5px;
      margin-top: 5px;
    }
    
    .footer {
      text-align: center;
      margin-top: 15px;
      border-top: 1px dashed #000;
      padding-top: 10px;
      font-size: 11px;
    }
    
    @media print {
      body {
        width: 80mm;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>FRESHCLEAN LAUNDRY</h1>
    <div>Jl. Contoh No. 123</div>
    <div>Telp: 0812-3456-7890</div>
  </div>
  
  <div class="info">
    <div class="info-row">
      <span>Invoice:</span>
      <span class="bold">${data.invoiceNumber}</span>
    </div>
    <div class="info-row">
      <span>Tanggal:</span>
      <span>${formatDate(data.createdAt)}</span>
    </div>
    <div class="info-row">
      <span>Customer:</span>
      <span>${data.customerName}</span>
    </div>
    <div class="info-row">
      <span>HP:</span>
      <span>${data.customerPhone}</span>
    </div>
  </div>
  
  <div class="items">
    ${data.items.map(item => `
      <div class="item">
        <div class="item-name">${item.serviceName}</div>
        <div class="item-detail">
          <span>${item.weight} kg x ${formatCurrency(item.pricePerKg)}</span>
          <span>${formatCurrency(item.subtotal)}</span>
        </div>
      </div>
    `).join('')}
  </div>
  
  <div class="summary">
    <div class="summary-row total">
      <span>TOTAL:</span>
      <span>${formatCurrency(data.totalAmount)}</span>
    </div>
    <div class="summary-row">
      <span>Dibayar (${data.paymentMethod.toUpperCase()}):</span>
      <span>${formatCurrency(data.paidAmount)}</span>
    </div>
    <div class="summary-row" style="font-weight: bold;">
      <span>Sisa:</span>
      <span>${formatCurrency(data.remaining)}</span>
    </div>
  </div>
  
  <div class="footer">
    <div>Selesai: ${formatDate(data.estimatedCompletion)}</div>
    <div style="margin-top: 10px;">*** TERIMA KASIH ***</div>
    <div>Barang dianggap lunas setelah diambil</div>
  </div>
</body>
</html>
  `
}

/**
 * Send receipt to WhatsApp
 */
export function sendWhatsApp(data: ReceiptData) {
  const message = generateWhatsAppMessage(data)
  
  // Clean phone number (remove +, spaces, etc)
  let phone = data.customerPhone.replace(/[^0-9]/g, '')
  
  // Add country code if not present
  if (!phone.startsWith('62')) {
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1)
    } else {
      phone = '62' + phone
    }
  }
  
  // Open WhatsApp with pre-filled message
  const whatsappURL = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  window.open(whatsappURL, '_blank')
}

/**
 * Generate WhatsApp message
 */
function generateWhatsAppMessage(data: ReceiptData): string {
  const formatCurrency = (amount: number) => {
    return 'Rp ' + amount.toLocaleString('id-ID')
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const paymentStatusEmoji = data.remaining === 0 ? '✅' : data.paidAmount > 0 ? '⚠️' : '❌'
  const paymentStatus = data.remaining === 0 ? 'LUNAS' : data.paidAmount > 0 ? 'DP' : 'BELUM BAYAR'

  let message = `🧺 *NOTA LAUNDRY FRESHCLEAN*\n`
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`
  
  message += `📋 *Invoice:* ${data.invoiceNumber}\n`
  message += `👤 *Customer:* ${data.customerName}\n`
  message += `📅 *Tanggal:* ${formatDate(data.createdAt)}\n\n`
  
  message += `*DETAIL PESANAN:*\n`
  data.items.forEach((item, index) => {
    message += `${index + 1}. ${item.serviceName}\n`
    message += `   ${item.weight} kg × ${formatCurrency(item.pricePerKg)} = ${formatCurrency(item.subtotal)}\n`
  })
  
  message += `\n━━━━━━━━━━━━━━━━━━━━━\n`
  message += `💰 *TOTAL:* ${formatCurrency(data.totalAmount)}\n`
  message += `💵 *Dibayar (${data.paymentMethod.toUpperCase()}):* ${formatCurrency(data.paidAmount)}\n`
  
  if (data.remaining > 0) {
    message += `⚠️ *Sisa Bayar:* ${formatCurrency(data.remaining)}\n`
  }
  
  message += `\n${paymentStatusEmoji} *Status:* ${paymentStatus}\n\n`
  
  message += `📆 *Estimasi Selesai:* ${formatDate(data.estimatedCompletion)}\n\n`
  
  message += `━━━━━━━━━━━━━━━━━━━━━\n`
  message += `🏪 *FreshClean Laundry*\n`
  message += `📞 0812-3456-7890\n`
  message += `📍 Jl. Contoh No. 123\n\n`
  message += `_Terima kasih atas kepercayaan Anda!_`

  return message
}
