/* ===== Shop Manager — i18n (Hindi ⇄ English) =====
   LANG = 'hi' -> source ke Hindi strings jaise hain waise dikhte hain.
   LANG = 'en' -> render output ke Hindi tukde English me badle jaate hain.
   Data (item/customer names) translate NAHI hote — sirf UI labels. */

export let LANG = 'hi';
export function setLangValue(l) { LANG = l; }

/* Longest-first matching ke liye phrase map. */
const EN = {
  /* ---- nav / screens ---- */
  'मुख्य': 'Main', 'स्टॉक': 'Stock', 'खाता': 'Accounts', 'अन्य': 'Other',
  'डैशबोर्ड': 'Dashboard', 'नया बिल (F2)': 'New Bill (F2)', 'बिल लिस्ट': 'Bill List',
  'आइटम / स्टॉक': 'Items / Stock', 'खरीद (Purchase)': 'Purchase',
  'ग्राहक / उधार': 'Customers / Credit', 'भुगतान': 'Payments', 'खर्च': 'Expenses',
  'रिपोर्ट्स': 'Reports', 'सेटिंग्स': 'Settings', 'नया बिल': 'New Bill',
  'आइटम / स्टॉक': 'Items / Stock', 'खरीद': 'Purchase', 'ग्राहक और उधार': 'Customers & Credit',

  /* ---- dashboard ---- */
  'आज की बिक्री': "Today's Sale", 'आज का मुनाफा': "Today's Profit",
  'कुल उधार बाकी': 'Total Receivable', 'कम स्टॉक (तुरंत मंगाएँ)': 'Low Stock (Order Now)',
  'कम स्टॉक': 'Low Stock', 'स्टॉक जोड़ें': 'Add Stock', 'नया ग्राहक': 'New Customer',
  'भुगतान लें': 'Receive Payment', 'साप्ताहिक रिपोर्ट तैयार है': 'Weekly report is ready',
  'साप्ताहिक रिपोर्ट —': 'Weekly Report —', 'साप्ताहिक रिपोर्ट': 'Weekly Report',
  'इस महीने —': 'This Month —', 'इस महीने': 'This Month',
  'कुल बिक्री (': 'Total Sale (', 'कुल बिक्री': 'Total Sale',
  'लागत (COGS)': 'Cost (COGS)', 'ग्रॉस प्रॉफिट': 'Gross Profit',
  'नेट प्रॉफिट': 'Net Profit', 'पिछले 6 महीने की बिक्री': 'Last 6 Months Sale',
  'सबसे ज़्यादा:': 'Highest:', 'सबसे ज़्यादा उधार': 'Top Debtors',
  'टॉप 5 आइटम (30 दिन)': 'Top 5 Items (30 days)',
  'सब ठीक है ✓': 'All good ✓', 'कोई उधार नहीं ✓': 'No credit pending ✓',
  'आइटम कम': 'items low', 'स्टॉक ठीक': 'Stock OK', 'उधार': 'Credit',

  /* ---- POS ---- */
  'ग्राहक': 'Customer', 'नकद ग्राहक (Walk-in)': 'Cash Customer (Walk-in)',
  'नकद ग्राहक': 'Cash Customer', 'बिल नंबर': 'Bill No', 'बिल नं / ग्राहक': 'Bill no / Customer',
  'बिल नं:': 'Bill No:', 'बिल नं': 'Bill No',
  'पुराना उधार:': 'Old dues:', 'पुराना उधार': 'Old Dues',
  'आइटम खोजें — नाम / कोड / बारकोड टाइप करें': 'Search item — type name / code / barcode',
  'जैसे: चीनी, आटा, I1001 …': 'e.g. Sugar, Flour, I1001 …',
  'ऊपर सर्च करके आइटम जोड़ें': 'Search above to add items',
  'बारकोड स्कैनर भी चलेगा': 'USB barcode scanner also works',
  'सब-टोटल': 'Sub-total', 'बिल छूट': 'Bill Discount', 'पेमेंट मोड': 'Payment Mode',
  'नकद/UPI प्राप्त': 'Cash/UPI received', 'नकद प्राप्त': 'Cash received',
  'अभी मिले': 'Received Now', 'खाते में जाएगा': 'Goes to credit',
  'उधार के लिए ग्राहक चुनें': 'Select a customer for credit',
  'उधार के लिए ग्राहक चुनना ज़रूरी है': 'Customer is required for credit sale',
  'सेव + प्रिंट (F9)': 'Save + Print (F9)', 'सिर्फ सेव': 'Save Only',
  'रद्द (Esc)': 'Cancel (Esc)', 'शॉर्टकट:': 'Shortcuts:',
  'नया बिल · F9 सेव+प्रिंट · Esc रद्द': 'New Bill · F9 Save+Print · Esc Cancel',
  'सर्च में ↑↓ और Enter से आइटम चुनें': 'Use ↑↓ and Enter in search to pick items',
  'का स्टॉक 0 है': 'has 0 stock', 'चेतावनी:': 'Warning:',
  'सेव हुआ —': 'saved —', 'की क्रेडिट लिमिट पार हो गई': 'has crossed the credit limit',

  /* ---- bills ---- */
  'यह बिल रद्द करें? स्टॉक वापस जुड़ जाएगा।': 'Void this bill? Stock will be added back.',
  'बिल रद्द हुआ': 'Bill voided', 'कोई बिल नहीं': 'No bills',
  'बिल / INVOICE': 'BILL / INVOICE', 'बिल)': 'bills)', 'बिल': 'Bills',
  'भुगतान (': 'Payment (', 'बाकी (उधार)': 'Balance (Credit)',
  'धन्यवाद! फिर पधारें 🙏': 'Thank you! Visit again 🙏',

  /* ---- items ---- */
  'नाम / कोड / बारकोड': 'Name / code / barcode', 'श्रेणी': 'Category',
  'फ़िल्टर': 'Filter', 'सभी आइटम': 'All items', 'सभी ग्राहक': 'All customers',
  'नया आइटम': 'New Item', 'आइटम एडिट': 'Edit Item', 'आइटम का नाम *': 'Item Name *',
  'कुल आइटम:': 'Total items:', 'कुल आइटम': 'Total Items',
  'स्टॉक वैल्यू:': 'Stock value:', 'स्टॉक वैल्यू': 'Stock Value',
  'डेड स्टॉक (दिन)': 'Dead Stock (days)', 'डेड स्टॉक (': 'Dead Stock (',
  'डेड स्टॉक': 'Dead Stock', 'दिन से नहीं बिका)': 'days not sold)',
  'कोई आइटम नहीं': 'No items', 'आइटम सेव हुआ': 'Item saved', 'आइटम हटाया': 'Item removed',
  'नाम और बिक्री भाव ज़रूरी है': 'Name and sale rate are required',
  'मिन स्टॉक (अलर्ट)': 'Min Stock (alert)', 'शुरुआती स्टॉक': 'Opening Stock',
  'मौजूदा स्टॉक:': 'Current stock:', 'मौजूदा स्टॉक': 'Current Stock',
  'स्टॉक बदलने के लिए “±” (एडजस्टमेंट) या खरीद एंट्री का उपयोग करें।':
    'To change stock use "±" (adjustment) or a purchase entry.',
  'स्टॉक एडजस्ट —': 'Stock Adjust —', 'स्टॉक एडजस्ट हुआ': 'Stock adjusted',
  'बदलाव (+ जोड़ / − घटाएँ)': 'Change (+ add / − reduce)', 'कारण': 'Reason',
  'खराब/डैमेज': 'Damaged', 'एक्सपायरी': 'Expired', 'चोरी/गुम': 'Theft/Lost',
  'खुद इस्तेमाल': 'Self use', 'गिनती सुधार': 'Count correction',
  'बिक्री भाव *': 'Sale Rate *', 'खरीद भाव': 'Purchase Rate',
  'नया बिक्री भाव': 'New Sale Rate', 'यूनिट': 'Unit', 'बारकोड': 'Barcode',
  'रैक': 'Rack', 'कोड': 'Code', 'मार्जिन': 'Margin', 'वैल्यू': 'Value',

  /* ---- purchase ---- */
  'नई खरीद एंट्री (स्टॉक इन)': 'New Purchase Entry (Stock In)',
  'सप्लायर को भुगतान': 'Pay to Supplier', 'सप्लायर को दिए': 'Paid to Supplier',
  'सप्लायर': 'Supplier', 'पिछली खरीद': 'Previous Purchases',
  'खरीद सेव करें': 'Save Purchase', 'खरीद सेव हुई — स्टॉक अपडेट': 'Purchase saved — stock updated',
  'कम से कम एक आइटम चुनें': 'Select at least one item',
  'कोई खरीद नहीं': 'No purchases', 'पंक्ति” दबाकर आइटम जोड़ें': 'Row" to add items',
  'पंक्ति': 'Row',

  /* ---- customers ---- */
  'नाम / मोबाइल': 'Name / mobile', 'जिन पर उधार है': 'With outstanding',
  'दिन पुराना उधार': 'days old credit', 'दिन पुराना': 'days old',
  'उधार PDF': 'Credit PDF', 'उधार लिस्ट PDF': 'Credit List PDF',
  'बाकी रकम': 'Balance Due', 'क्रेडिट लिमिट': 'Credit Limit',
  'लिमिट पार': 'Limit crossed', 'लिमिट': 'Limit',
  'क्लियर': 'Clear', 'बहुत पुराना': 'Very old', 'ओवरड्यू उधार (दिन)': 'Overdue credit (days)',
  'ओवरड्यू': 'Overdue', 'चालू': 'Current', 'स्थिति': 'Status',
  'उच्च जोखिम': 'High Risk', 'मध्यम जोखिम': 'Medium Risk', 'सामान्य जोखिम': 'Low Risk',
  'उच्च': 'High', 'मध्यम': 'Medium', 'सामान्य': 'Low', 'चुकता': 'Clear',
  'ऑटो स्टेटस': 'Auto Status', 'ऑटो स्टेटस सीमाएँ': 'Auto Status Thresholds',
  'मध्यम जोखिम सीमा (₹)': 'Medium Risk Threshold (₹)', 'मध्यम लंबित दिन': 'Medium Pending Days',
  'उच्च जोखिम सीमा (₹)': 'High Risk Threshold (₹)', 'उच्च लंबित दिन': 'High Pending Days',
  'व्हाट्सएप रिमाइंडर': 'WhatsApp Reminder', 'संदेश सुझाव': 'Message Suggestions',
  'सौम्य संदेश': 'Gentle Message', 'सामान्य संदेश': 'Standard Message',
  'अत्यावश्यक संदेश': 'Urgent Notice', 'खाता विवरण संदेश': 'Statement Message',
  'कस्टम संदेश': 'Custom Message', 'WhatsApp पर भेजें': 'Send via WhatsApp',
  'साप्ताहिक उधार समीक्षा': 'Weekly Credit Review', 'साप्ताहिक अलर्ट': 'Weekly Alert',
  'कोई ग्राहक नहीं': 'No customers', 'ग्राहक एडिट': 'Edit Customer',
  'ग्राहक सेव हुआ': 'Customer saved', 'नाम ज़रूरी है': 'Name is required',
  'ओपनिंग बैलेंस (पुराना उधार)': 'Opening Balance (old dues)', 'ओपनिंग बैलेंस': 'Opening Balance',
  'खाता —': 'Ledger —', 'एडवांस जमा': 'Advance Paid', 'चुका दिया': 'Cleared',
  'कुल उधार था': 'Original credit was', 'उधार (कुल बिल': 'Credit (bill total',
  ', नकद': ', cash', 'बिल INV': 'Bill INV', 'कुल लेन-देन': 'Total Transactions',
  'उधार (Dr)': 'Debit (Dr)', 'जमा (Cr)': 'Credit (Cr)',
  'कोई लेन-देन नहीं': 'No transactions', 'बैलेंस': 'Balance',
  'स्टेटमेंट PDF': 'Statement PDF', 'रिमाइंडर': 'Reminder',
  'ग्राहक खाता विवरण (Statement)': 'Customer Ledger Statement',
  'उधार / बकाया ग्राहक सूची': 'Credit / Outstanding Customers List',
  'कुल बकाया:': 'Total outstanding:', 'कुल बकाया': 'Total Outstanding',
  'सबसे पुराना बिल': 'Oldest Bill',
  'कृपया बकाया राशि शीघ्र जमा करें।': 'Please clear your outstanding amount soon.',
  'नमस्ते': 'Hello', 'जी,': ',',
  'में': 'at', 'बकाया है।': 'is outstanding.', 'कृपया जल्दी जमा करें।': 'Please pay soon.',
  'धन्यवाद 🙏': 'Thank you 🙏', 'आपका': 'Your amount of',

  /* ---- payments / expenses ---- */
  'ग्राहक से भुगतान लें': 'Receive from Customer',
  'ग्राहक से भुगतान प्राप्त': 'Payment Received from Customer',
  'कुल प्राप्त': 'Total Received', 'कोई भुगतान नहीं': 'No payments',
  'भुगतान दर्ज हुआ —': 'Payment recorded —', 'भुगतान प्राप्त (': 'Payment received (',
  'पार्टी और रकम ज़रूरी है': 'Party and amount are required',
  'पार्टी *': 'Party *', 'पार्टी': 'Party', 'बकाया:': 'Outstanding:', 'बकाया': 'Outstanding',
  'प्राप्त': 'Received', 'दिया': 'Paid', 'प्रकार': 'Type',
  'नया खर्च': 'New Expense', 'खर्च जोड़ें': 'Add Expense', 'खर्च दर्ज हुआ': 'Expense recorded',
  'कोई खर्च नहीं': 'No expenses', 'रकम डालें': 'Enter amount',
  'किराया': 'Rent', 'बिजली': 'Electricity', 'तनख्वाह': 'Salary',
  'ट्रांसपोर्ट': 'Transport', 'चाय-पानी': 'Tea/Snacks', 'मरम्मत': 'Repairs',
  'पैकिंग': 'Packing', 'खर्च —': 'Expense —', 'कुल खर्च': 'Total Expenses',
  'दुकान किराया': 'Shop rent', 'हेल्पर': 'Helper', 'आंशिक भुगतान': 'Partial payment',

  /* ---- reports ---- */
  'महीना': 'Month', 'माह': 'Month',
  'लाभ-हानि —': 'Profit & Loss —', 'मासिक लाभ-हानि रिपोर्ट —': 'Monthly Profit & Loss Report —',
  'माल की लागत (COGS)': 'Cost of Goods Sold (COGS)', 'दी गई छूट': 'Discount Given',
  'उधार में गया': 'Went on credit', 'उधार गया': 'on credit',
  'महीने का नेट प्रॉफिट': 'Months Net Profit',
  'आइटम-वार मुनाफा (टॉप 20)': 'Item-wise Profit (Top 20)',
  'आइटम-वार मुनाफा —': 'Item-wise Profit —',
  'स्टॉक रिपोर्ट / वैल्यूएशन': 'Stock Report / Valuation',
  'स्टॉक रिपोर्ट PDF': 'Stock Report PDF', 'डाउनलोड हुई': 'downloaded',
  'डेटा नहीं': 'No data', 'कुल वैल्यू': 'Total Value', 'दर': 'Rate',
  'क्र.': 'Sr.', 'विवरण': 'Description', 'कुल': 'Total',

  /* ---- weekly ---- */
  'स्टॉक खत्म — तुरंत मंगाएँ': 'Out of Stock — Order Immediately',
  'स्टॉक खत्म': 'Out of Stock', 'सुझाव ऑर्डर': 'Suggested Order',
  'फँसी रकम': 'Blocked Amount', 'आखिरी बिक्री': 'Last Sold', 'कभी नहीं': 'Never',
  'पड़ा है': 'Lying', 'इस हफ़्ते सब ठीक है ✓': 'Everything is fine this week ✓',
  'ठीक है, देख लिया': 'OK, reviewed', 'रिपोर्ट देख ली गई': 'Report marked as seen',
  'PDF सेव करें': 'Save PDF', 'अभी रिपोर्ट देखें': 'View report now',
  'साप्ताहिक स्टॉक एवं उधार रिपोर्ट —': 'Weekly Stock & Credit Report —',
  'यह रिपोर्ट हर सप्ताह अपने आप बनती है।': 'This report is generated automatically every week.',
  'साप्ताहिक नोटिफिकेशन दिन': 'Weekly notification day',
  'आखिरी साप्ताहिक रिपोर्ट': 'Last weekly report',

  /* ---- settings ---- */
  'दुकान की जानकारी': 'Shop Details', 'दुकान का नाम': 'Shop Name',
  'अगला बिल नं': 'Next Bill No', 'बिल प्रीफिक्स': 'Bill Prefix',
  'स्टॉक और अलर्ट': 'Stock & Alerts', 'डिफ़ॉल्ट मिन स्टॉक': 'Default Min Stock',
  'कॉस्टिंग': 'Costing', 'वेटेड एवरेज': 'Weighted Average', 'लास्ट परचेज़ रेट': 'Last Purchase Rate',
  'बैकअप और डेटा': 'Backup & Data', 'बैकअप डाउनलोड': 'Download Backup',
  'बैकअप रिस्टोर हुआ': 'Backup restored', 'बैकअप रिस्टोर': 'Restore Backup',
  'सारा डेटा आपके इसी कंप्यूटर पर है। हफ़्ते में एक बार बैकअप ज़रूर लें (पेन ड्राइव में रखें)।':
    'All data stays on this computer. Take a backup once a week (keep it on a pen drive).',
  'सारा डेटा मिट जाएगा। पक्का?': 'All data will be erased. Are you sure?',
  'आखिरी चेतावनी — बैकअप ले लिया?': 'Final warning — have you taken a backup?',
  'सारा डेटा मिटाएँ': 'Erase All Data', 'फ़ाइल गलत है': 'Invalid file',
  'सिस्टम': 'System', 'कुल बिल': 'Total Bills', 'कुल ग्राहक': 'Total Customers',
  'डेटा साइज़': 'Data Size', 'थीम बदलें': 'Toggle Theme',
  'सेटिंग्स सेव हुईं': 'Settings saved', 'सेव करें': 'Save', 'भाषा': 'Language',

  /* ---- weekdays / months ---- */
  'रविवार': 'Sunday', 'सोमवार': 'Monday', 'मंगलवार': 'Tuesday', 'बुधवार': 'Wednesday',
  'गुरुवार': 'Thursday', 'शुक्रवार': 'Friday', 'शनिवार': 'Saturday',
  'जनवरी': 'January', 'फरवरी': 'February', 'मार्च': 'March', 'अप्रैल': 'April',
  'मई': 'May', 'जून': 'June', 'जुलाई': 'July', 'अगस्त': 'August',
  'सितम्बर': 'September', 'अक्टूबर': 'October', 'नवम्बर': 'November', 'दिसम्बर': 'December',

  /* ---- common words (short, last) ---- */
  'ग्राहक कुल:': 'Customers:', 'ग्राहक कुल': 'customers', 'स्टॉक खत्म': 'Out of Stock',
  'यह कोड पहले से इस्तेमाल में है: ': 'This code is already in use: ',
  'यह बारकोड पहले से इस्तेमाल में है: ': 'This barcode is already in use: ',
  'इसी नाम का आइटम पहले से है: ': 'An item with this name already exists: ',
  'क्या फिर भी सेव करें?': 'Save anyway?',
  'यह कोड "': 'This code already belongs to "',
  'यह बारकोड "': 'This barcode already belongs to "',
  '" के पास पहले से है': '"',
  'कोड ज़रूरी है': 'Code is required',
  'कोड खाली नहीं हो सकता': 'Code cannot be empty',
  'कोड *': 'Code *',
  'स्टोरेज भर गया! तुरंत बैकअप लें और पुराना डेटा हटाएँ।': 'Storage full! Take a backup now and remove old data.',
  'डेटा सेव नहीं हुआ! Private/Incognito मोड बंद करें।': 'Data not saved! Turn off Private/Incognito mode.',
  'डेटा सेव नहीं हुआ (internal error)।': 'Data not saved (internal error).',
  'डेटा सेव नहीं हुआ (validation fail)।': 'Data not saved (validation failed).',
  'डेटा सेव नहीं हुआ!': 'Data not saved!',
  '⚠ डेटा में गड़बड़ी थी — पिछले सेव से रिकवर किया गया': '⚠ Data was corrupt — recovered from previous save',
  '⚠ डेटा में गड़बड़ी थी — आज के स्नैपशॉट से रिकवर किया गया': '⚠ Data was corrupt — recovered from today\'s snapshot',
  '💾 अभी तक बैकअप नहीं लिया — अभी लें!': '💾 No backup taken yet — do it now!',
  'दिन से बैकअप नहीं लिया': 'days since last backup',
  'बैकअप और डेटा सुरक्षा': 'Backup & Data Safety',
  'आखिरी बैकअप': 'Last Backup', 'कभी नहीं': 'Never',
  'स्टोरेज इस्तेमाल': 'Storage Used', 'सुरक्षा कॉपियाँ': 'Safety Copies',
  'पिछला सेव': 'previous save',
  '⚠ बैकअप लिए': '⚠ Backup taken', 'हो गए — अभी लें!': 'ago — take one now!',
  '⚠ स्टोरेज लगभग भर गया! बैकअप लेकर पुराने बिल हटाएँ।': '⚠ Storage almost full! Back up and remove old bills.',
  'बैकअप डाउनलोड हुआ': 'Backup downloaded',
  '↩ पिछले सेव पर जाएँ': '↩ Rollback to previous save',
  'पिछले सेव पर वापस जाएँ? इसके बाद के बदलाव चले जाएँगे।': 'Roll back to previous save? Changes after it will be lost.',
  'पिछले सेव पर वापस आ गए': 'Rolled back to previous save',
  'पिछला सेव उपलब्ध नहीं': 'No previous save available',
  'मौजूदा डेटा हट जाएगा और बैकअप वाला डेटा आ जाएगा। जारी रखें?': 'Current data will be replaced by the backup. Continue?',
  'यह Shop Manager की सही बैकअप फ़ाइल नहीं है': 'This is not a valid Shop Manager backup file',
  'अभी बैकअप लें': 'Back up now',
  'दिन पहले': 'days ago',
  'प्लान': 'Plan', '⚠ फोटो': '⚠ Photos', 'भर गईं': 'full',
  'रेट लिस्ट': 'Rate List', 'सूची': 'Lists',
  'यह सिर्फ': 'This is just a', 'है — बिल जल्दी बनाने के लिए। स्टॉक/मात्रा track नहीं होती।': '— to make bills faster. Stock/quantity is not tracked.',
  'ग्राहक की फोटो': 'Customer Photo', '📁 फोटो चुनें': '📁 Choose Photo', '📷 कैमरा': '📷 Camera',
  'वैकल्पिक — पहचान के लिए': 'Optional — for identification',
  'फोटो जुड़ गई': 'Photo added', 'फोटो ले ली गई': 'Photo captured', 'फोटो लें': 'Take Photo',
  'खींचें': 'Capture', 'कैमरा उपलब्ध नहीं': 'Camera not available',
  'कैमरा नहीं खुला — अनुमति दें': 'Camera blocked — please allow access',
  'यह इमेज फाइल नहीं है': 'This is not an image file',
  'फोटो बहुत बड़ी है (12MB से कम चुनें)': 'Photo too large (choose under 12MB)',
  'फोटो लोड नहीं हुई': 'Could not load photo',
  'फोटो वाले ग्राहक': 'Customers with photo', 'रेट लिस्ट आइटम': 'Rate list items',
  'पुराने उधार': 'Old Dues', 'सबसे पुराने उधार': 'Oldest Dues',
  'कोई पुराना उधार नहीं ✓': 'No old dues ✓', '✓ सब ठीक': '✓ All good',
  'उधार और अलर्ट': 'Credit & Alerts', 'साप्ताहिक उधार रिपोर्ट —': 'Weekly Credit Report —',
  'कुल फँसी रकम:': 'Total blocked amount:', 'इस हफ़्ते नया उधार': 'New credit this week',
  'इस हफ़्ते का नया उधार': 'New Credit This Week', '🆕 इस हफ़्ते का नया उधार': '🆕 New Credit This Week',
  '⚠ क्रेडिट लिमिट पार': '⚠ Credit Limit Crossed', 'क्रेडिट लिमिट पार': 'Credit Limit Crossed',
  'रिमाइंडर': 'Remind', 'या नया नाम+भाव सीधे टाइप करें': 'or type a new name + rate directly',
  'बिल बने': 'bills', 'खोजें': 'Search', 'तारीख:': 'Date:', 'तारीख': 'Date', 'से': 'From', 'तक': 'To',
  'नाम *': 'Name *', 'नाम': 'Name', 'मोबाइल': 'Mobile', 'पता': 'Address',
  'नोट': 'Note', 'रकम *': 'Amount *', 'रकम': 'Amount', 'मोड': 'Mode',
  'मात्रा': 'Qty', 'भाव': 'Rate', 'छूट': 'Discount', 'आइटम': 'Item',
  'बचा': 'Left', 'मिन': 'Min', 'दिए': 'Paid', 'मिले': 'Paid', 'बाकी': 'Due',
  'लागत': 'Cost', 'मुनाफा': 'Profit', 'बिक्री': 'Sale', 'दिन': 'Days',
  'खत्म': 'Out', 'कम': 'Low', 'ठीक': 'OK', 'सभी': 'All', 'जमा': 'Credit',
  'सेव': 'Save', 'रद्द': 'Cancel', 'हटाएँ': 'Delete', 'बंद': 'Close', 'नया': 'New',
  'चुनें —': 'Select —', 'खाता': 'Ledger', 'नकद': 'Cash', 'आंशिक': 'Partial',
  'जनरेट:': 'Generated:', 'मो.': 'Mob.', 'ग्राहक:': 'Customer:', 'स्टॉक:': 'Stock:',
  'कम स्टॉक:': 'Low stock:', 'स्टॉक': 'Stock', 'खरीद': 'Purchase', 'खर्च': 'Expense'
};

/* Demo/seed data (item names, categories, people) — sirf display ke liye */
const EN_DATA = {
  'श्री बालाजी किराना स्टोर': 'Shri Balaji Kirana Store',
  'मेन बाज़ार, लुधियाना, पंजाब': 'Main Bazaar, Ludhiana, Punjab', 'लुधियाना': 'Ludhiana',
  'किराना': 'Grocery', 'तेल-घी': 'Oil & Ghee', 'दाल-चावल': 'Pulses & Rice',
  'मसाले': 'Spices', 'बिस्किट-नमकीन': 'Biscuits & Snacks',
  'साबुन-डिटर्जेंट': 'Soap & Detergent', 'पेय': 'Beverages',
  'आटा 10kg': 'Flour 10kg', 'चीनी': 'Sugar', 'चावल बासमती': 'Basmati Rice',
  'तूर दाल': 'Toor Dal', 'सरसों तेल 1L': 'Mustard Oil 1L', 'रिफाइंड तेल 1L': 'Refined Oil 1L',
  'देसी घी 500g': 'Desi Ghee 500g', 'हल्दी 100g': 'Turmeric 100g',
  'लाल मिर्च 100g': 'Red Chilli 100g', 'गरम मसाला 50g': 'Garam Masala 50g',
  'पारले-जी': 'Parle-G', 'गुड डे बिस्किट': 'Good Day Biscuit', 'कुरकुरे': 'Kurkure',
  'सर्फ एक्सेल 1kg': 'Surf Excel 1kg', 'लाइफबॉय साबुन': 'Lifebuoy Soap',
  'कोलगेट 100g': 'Colgate 100g', 'कोका कोला 750ml': 'Coca Cola 750ml',
  'फ्रूटी 200ml': 'Frooti 200ml', 'चाय पत्ती 250g': 'Tea Leaves 250g',
  'नमक 1kg': 'Salt 1kg', 'बेसन 500g': 'Besan 500g', 'मैगी 12pc': 'Maggi 12pc',
  'रमेश कुमार': 'Ramesh Kumar', 'सुनीता देवी': 'Sunita Devi', 'गुरप्रीत सिंह': 'Gurpreet Singh',
  'अमित शर्मा': 'Amit Sharma', 'होटल शगुन': 'Hotel Shagun', 'मनजीत कौर': 'Manjeet Kaur',
  'विक्रम ढाबा': 'Vikram Dhaba', 'पूजा रानी': 'Pooja Rani',
  'राज ट्रेडर्स': 'Raj Traders', 'बालाजी होलसेल': 'Balaji Wholesale',
  'पंजाब डिस्ट्रीब्यूटर्स': 'Punjab Distributors'
};

/* Longest-first sorted key list — build once */
const _KEYS = Object.keys(EN).concat(Object.keys(EN_DATA)).sort((a, b) => b.length - a.length);
const _MAP = Object.assign({}, EN, EN_DATA);
const _RE = new RegExp(_KEYS.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');

/* T(text) — translate a plain string */
export function T(s) {
  if (LANG !== 'en' || !s) return s;
  return String(s).replace(_RE, m => _MAP[m] || m);
}

/* TH(html) — translate only text nodes of an HTML string (attributes/JS safe) */
export function TH(html) {
  if (LANG !== 'en' || !html) return html;
  return String(html).split(/(<[^>]*>)/g)
    .map(part => part.startsWith('<') ? _tAttr(part) : T(part))
    .join('');
}
/* tag ke andar sirf placeholder/title/value-of-option translate karo */
function _tAttr(tag) {
  return tag.replace(/(placeholder|title)="([^"]*)"/g, (m, a, v) => `${a}="${T(v)}"`);
}

