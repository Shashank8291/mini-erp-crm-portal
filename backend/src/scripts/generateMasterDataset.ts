// scripts/generateMasterDataset.ts
import * as fs from 'fs';
import * as path from 'path';

interface Customer {
  id: number;
  name: string;
  mobile: string;
  email: string;
  business_name: string;
  gst_no: string | null;
  type: 'Retail' | 'Wholesale' | 'Distributor';
  address: string;
  status: 'Lead' | 'Active' | 'Inactive';
  follow_up_date: string | null;
  notes: string;
  created_at: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  min_stock_alert: number;
  location: string;
  created_at: string;
}

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name_snapshot: string;
  product_price_snapshot: number;
  quantity: number;
}

interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name?: string;
  business_name?: string;
  status: 'Draft' | 'Confirmed' | 'Cancelled';
  total_quantity: number;
  total_amount?: number;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  items?: OrderItem[];
}

interface StockMovement {
  id: number;
  product_id: number;
  product_name?: string;
  sku?: string;
  quantity_changed: number;
  movement_type: 'IN' | 'OUT';
  reason: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
}

// 1. Raw Customers (65)
const rawCustomers: Array<Omit<Customer, 'id' | 'created_at'>> = [
  { name: 'Rajesh M. Sharma', mobile: '+91 98201 12345', email: 'rajesh@ganeshelec.in', business_name: 'Shree Ganesh Electricals & Hardware', gst_no: '27AAACS1234A1Z1', type: 'Wholesale', address: 'Plot 42, MIDC Industrial Area, Andheri East, Mumbai, Maharashtra 400093', status: 'Active', follow_up_date: '2026-11-05', notes: 'Top wholesale buyer for switchgear and power cables. Bi-weekly bulk replenishment orders.' },
  { name: 'Sachin V. Patil', mobile: '+91 98220 54321', email: 'sachin@kalyaniprecision.co.in', business_name: 'Kalyani Precision Engineering Works', gst_no: '27AABCK4829K1Z5', type: 'Wholesale', address: 'B-14 Bhosari Industrial Estate, Pune, Maharashtra 411026', status: 'Active', follow_up_date: '2026-11-10', notes: 'Key automotive tooling client. Requires periodic high-tensile fastener batches.' },
  { name: 'Bhavesh R. Patel', mobile: '+91 98795 67890', email: 'bhavesh@mahalaxmiind.com', business_name: 'Mahalaxmi Industrial Supplies', gst_no: '24AAAFM9021M1Z8', type: 'Distributor', address: 'Shreeji Complex, Naroda GIDC Phase 2, Ahmedabad, Gujarat 382330', status: 'Active', follow_up_date: '2026-11-12', notes: 'Primary distributor covering Central Gujarat. Authorized reseller for industrial equipment.' },
  { name: 'Suresh N. Rao', mobile: '+91 98450 11223', email: 'suresh@apexsafety.in', business_name: 'Apex Safety & Tools Mart', gst_no: '29AAACA5512A1Z3', type: 'Wholesale', address: '88 Peenya Industrial Area, 3rd Phase, Bengaluru, Karnataka 560058', status: 'Active', follow_up_date: '2026-11-08', notes: 'Heavy purchaser of industrial PPE, safety helmets, and fall protection gear.' },
  { name: 'K. Ramanathan', mobile: '+91 98400 99887', email: 'ramanathan@meenakshifasteners.com', business_name: 'Meenakshi Fasteners & Fixings', gst_no: '33AAACM3341M1Z6', type: 'Distributor', address: '14 Ambattur Industrial Estate, Chennai, Tamil Nadu 600058', status: 'Active', follow_up_date: '2026-11-15', notes: 'Large stockist for SS304 nuts, bolts, and heavy wedge anchors across Tamil Nadu.' },
  { name: 'Vikramjeet Singh', mobile: '+91 98110 33445', email: 'vikram@capitalmachinery.com', business_name: 'Capital Heavy Machinery Depot', gst_no: '07AAACC7890C1Z2', type: 'Distributor', address: 'Plot 72, Okhla Industrial Area Phase 3, New Delhi, Delhi 110020', status: 'Active', follow_up_date: '2026-11-14', notes: 'Supplies heavy equipment, hoists, and power tools to Delhi-NCR contractors.' },
  { name: 'Debabrata Ghosh', mobile: '+91 98300 77665', email: 'd.ghosh@howrahtool.in', business_name: 'Howrah Tool & Hardware Corp', gst_no: '19AAACH4521H1Z9', type: 'Wholesale', address: '204 Netaji Subhash Road, Howrah, West Bengal 711101', status: 'Active', follow_up_date: '2026-11-03', notes: 'Historic regional dealer for heavy machining, vises, and hand tools.' },
  { name: 'Venkat Reddy', mobile: '+91 98480 44556', email: 'venkat@deccanindustrial.in', business_name: 'Deccan Industrial Solutions', gst_no: '36AAACD1123D1Z4', type: 'Wholesale', address: 'Shed 19, Balanagar Industrial Development Area, Hyderabad, Telangana 500037', status: 'Active', follow_up_date: '2026-11-16', notes: 'High frequency order cycle for electrical panels and wiring accessories.' },
  { name: 'Mohanlal Agarwal', mobile: '+91 94140 88990', email: 'mohan@marwarelec.com', business_name: 'Marwar Electricals & Automation', gst_no: '08AAACM2234M1Z7', type: 'Retail', address: 'Shop 12, Nehru Bazaar, Jaipur, Rajasthan 302003', status: 'Active', follow_up_date: '2026-11-04', notes: 'Reliable retailer with steady monthly walk-in trade for MCBs and switches.' },
  { name: 'Gurpreet Singh Dhillon', mobile: '+91 98140 12389', email: 'gurpreet@ludhianaforgings.in', business_name: 'Ludhiana Heavy Forgings & Bolts', gst_no: '03AAACL6678L1Z1', type: 'Wholesale', address: 'G.T. Road, Focal Point Phase 5, Ludhiana, Punjab 141010', status: 'Active', follow_up_date: '2026-11-18', notes: 'Supplies forging units and tractor parts manufacturers with Grade 8.8 bolts.' },
  { name: 'Amit Bansal', mobile: '+91 98101 44552', email: 'amit@gurugramfitouts.com', business_name: 'Gurugram Commercial Fitouts', gst_no: '06AAACG9912G1Z0', type: 'Wholesale', address: 'Sector 34, Udyog Vihar Phase 7, Gurugram, Haryana 122004', status: 'Active', follow_up_date: '2026-11-06', notes: 'Corporate office and warehouse interior contracting supplier.' },
  { name: 'Prashant Jadhav', mobile: '+91 98230 66778', email: 'prashant@nashikmotors.in', business_name: 'Nashik Agri-Industrial Motors', gst_no: '27AAACN3321N1Z2', type: 'Retail', address: 'Plot 55, Ambad MIDC, Nashik, Maharashtra 422010', status: 'Active', follow_up_date: '2026-11-09', notes: 'Specializes in agricultural pump accessories and 3-phase electric motors.' },
  { name: 'Hiren Shah', mobile: '+91 98250 33221', email: 'hiren@vphardware.co.in', business_name: 'Vadodara Petrochem Hardware', gst_no: '24AAACV8890V1Z5', type: 'Distributor', address: 'Makarpura GIDC Industrial Area, Vadodara, Gujarat 390010', status: 'Active', follow_up_date: '2026-11-20', notes: 'Distributes hydraulic flanges, non-asbestos gaskets, and safety apparatus.' },
  { name: 'S. Senthil Kumar', mobile: '+91 94430 77889', email: 'senthil@coimbatorepower.com', business_name: 'Coimbatore Power & Pumps Depot', gst_no: '33AAACC5567C1Z3', type: 'Wholesale', address: 'Cross Cut Road, Gandhipuram, Coimbatore, Tamil Nadu 641012', status: 'Active', follow_up_date: '2026-11-11', notes: 'Major pump manufacturing hub client. Orders contactors, cables, and bearings.' },
  { name: 'Ketan Parekh', mobile: '+91 98241 55667', email: 'ketan@surattools.in', business_name: 'Surat Diamond City Tools', gst_no: '24AAACS4456S1Z9', type: 'Retail', address: 'Ring Road Industrial Market, Surat, Gujarat 395002', status: 'Active', follow_up_date: '2026-11-07', notes: 'Supplies high-precision calipers, rotary tools, and bench grinders.' },
  { name: 'Nitin Deshmukh', mobile: '+91 98231 99001', email: 'nitin@nagpursafety.in', business_name: 'Nagpur Ferro-Alloys & Safety Gear', gst_no: '27AAACN7789N1Z4', type: 'Wholesale', address: 'MIDC Hingna Road, Nagpur, Maharashtra 440028', status: 'Active', follow_up_date: '2026-11-13', notes: 'Bulk PPE orders for smelting units and mining subcontractors in Vidarbha.' },
  { name: 'Anand Kulkarni', mobile: '+91 98452 33441', email: 'anand@belagavicastings.com', business_name: 'Belagavi Foundry & Castings', gst_no: '29AAACB1145B1Z7', type: 'Distributor', address: 'Udyambag Industrial Estate, Belagavi, Karnataka 590008', status: 'Active', follow_up_date: '2026-11-19', notes: 'Distributes casting clamps, heavy hardware, and safety gear.' },
  { name: 'Rajat Saxena', mobile: '+91 98180 77112', email: 'rajat@noidatechmaint.com', business_name: 'Noida Tech-Park Maintenance Corp', gst_no: '09AAACN8876N1Z8', type: 'Wholesale', address: 'Sector 62 Institutional Area, Noida, Uttar Pradesh 201309', status: 'Active', follow_up_date: '2026-11-05', notes: 'Ongoing facility maintenance contracts for IT parks and datacenters.' },
  { name: 'Sandeep Gulati', mobile: '+91 98112 55443', email: 'sandeep@ffabricators.in', business_name: 'Faridabad Fabricators & Hardware', gst_no: '06AAACF3342F1Z6', type: 'Wholesale', address: 'Mathura Road, Sector 15A, Faridabad, Haryana 121007', status: 'Active', follow_up_date: '2026-11-17', notes: 'Heavy steel fabrication vendor. Buys welding machines and anchor bolts.' },
  { name: 'Paresh Mehta', mobile: '+91 98251 22334', email: 'paresh@rajkotspares.com', business_name: 'Rajkot Diesel Engine Spares', gst_no: '24AAACR6654R1Z1', type: 'Distributor', address: 'Aji GIDC Industrial Zone, Rajkot, Gujarat 360003', status: 'Active', follow_up_date: '2026-11-21', notes: 'Distributor network covering Saurashtra engine manufacturing cluster.' },
  { name: 'Manjunath Hegde', mobile: '+91 98453 88776', email: 'manjunath@hubballielec.in', business_name: 'Hubballi Heavy Electricals', gst_no: '29AAACH9981H1Z5', type: 'Retail', address: 'Station Road, Hubballi, Karnataka 580020', status: 'Active', follow_up_date: '2026-11-04', notes: 'Regular buyer of switchboards, circuit breakers, and copper earthing busbars.' },
  { name: 'Muthuvel Pillai', mobile: '+91 94432 11990', email: 'muthu@maduraifasteners.com', business_name: 'Madurai Industrial Fasteners', gst_no: '33AAACM2219M1Z8', type: 'Retail', address: 'West Masi Street, Madurai, Tamil Nadu 625001', status: 'Active', follow_up_date: '2026-11-08', notes: 'Textile machinery spares and fastener retail outlet.' },
  { name: 'Soumitra Banerjee', mobile: '+91 98310 44558', email: 'soumitra@asansolsafety.in', business_name: 'Asansol Mining & Safety Equipment', gst_no: '19AAACA6671A1Z2', type: 'Distributor', address: 'Burnpur Road, Asansol, West Bengal 713325', status: 'Active', follow_up_date: '2026-11-22', notes: 'Authorized supplier for coal mine PPE, safety boots, and gas masks.' },
  { name: 'P. Ravinder Rao', mobile: '+91 98490 22331', email: 'ravinder@secunderabadwire.com', business_name: 'Secunderabad Wire & Cable House', gst_no: '36AAACS7781S1Z0', type: 'Wholesale', address: 'Ranigunj Electrical Market, Secunderabad, Telangana 500003', status: 'Active', follow_up_date: '2026-11-12', notes: 'Wholesale stockist for Polycab and Finolex industrial grade cables.' },
  { name: 'Milind Kadam', mobile: '+91 98221 77665', email: 'milind@aurangabadauto.co.in', business_name: 'Aurangabad Auto-Components Ancillary', gst_no: '27AAACA5561A1Z9', type: 'Wholesale', address: 'Waluj MIDC, Aurangabad, Maharashtra 431136', status: 'Active', follow_up_date: '2026-11-15', notes: 'Tier 2 automotive ancillary supplier. High standards for tool calibration.' },
  { name: 'Bherulal Gehlot', mobile: '+91 94141 55662', email: 'bherulal@jodhpurtools.in', business_name: 'Jodhpur Stone & Marble Tools', gst_no: '08AAACJ4432J1Z3', type: 'Retail', address: 'Heavy Industrial Area, Jodhpur, Rajasthan 342003', status: 'Active', follow_up_date: '2026-11-06', notes: 'Diamond cutting wheels, angle grinders, and safety goggles for quarries.' },
  { name: 'Harpreet Sodhi', mobile: '+91 98141 99882', email: 'harpreet@jalandharrubber.com', business_name: 'Jalandhar Sports & Industrial Rubber', gst_no: '03AAACJ8891J1Z4', type: 'Wholesale', address: 'Basti Nau, Jalandhar, Punjab 144002', status: 'Active', follow_up_date: '2026-11-14', notes: 'Rubber hoses, gaskets, and heavy caster wheels distributor.' },
  { name: 'Alok Jain', mobile: '+91 98260 44112', email: 'alok@indorehardware.in', business_name: 'Indore Commercial Hardware Hub', gst_no: '23AAACI1124I1Z8', type: 'Distributor', address: 'Sanwer Road Industrial Area, Indore, Madhya Pradesh 452015', status: 'Active', follow_up_date: '2026-11-25', notes: 'Major distributor for Malwa region. Consistently achieves quarterly sales targets.' },
  { name: 'Deepak Tiwari', mobile: '+91 98261 88993', email: 'deepak@bhopalelec.com', business_name: 'Bhopal Electrical Contractors Consortium', gst_no: '23AAACB5541B1Z2', type: 'Wholesale', address: 'Govindpura Industrial Area, Bhopal, Madhya Pradesh 462023', status: 'Active', follow_up_date: '2026-11-10', notes: 'Government electrical contractor association buying bulk switchgear.' },
  { name: 'K. Satyanarayana', mobile: '+91 98481 66554', email: 'satya@vizagmarine.com', business_name: 'Visakhapatnam Marine Supplies Ltd', gst_no: '37AAACV7781V1Z5', type: 'Distributor', address: 'Port Area Industrial Estate, Visakhapatnam, Andhra Pradesh 530035', status: 'Active', follow_up_date: '2026-11-24', notes: 'High-value buyer of wire rope slings, chain hoists, and waterproof lights.' },
  { name: 'Vishal More', mobile: '+91 98202 33441', email: 'vishal@nmwarehousing.in', business_name: 'Navi Mumbai Warehousing Solutions', gst_no: '27AAACN4419N1Z6', type: 'Wholesale', address: 'Taloja MIDC Warehouse Zone, Navi Mumbai, Maharashtra 410208', status: 'Active', follow_up_date: '2026-11-09', notes: '3PL warehouse operator buying hydraulic pallet trucks and plastic crates.' },
  { name: 'Sanjay Shinde', mobile: '+91 98203 77889', email: 'sanjay@thanetools.com', business_name: 'Thane Precision Machine Tools', gst_no: '27AAACT9981T1Z1', type: 'Wholesale', address: 'Wagle Industrial Estate, Thane West, Maharashtra 400604', status: 'Active', follow_up_date: '2026-11-13', notes: 'Specializes in CNC machining tools, drills, and pneumatic equipment.' },
  { name: 'Dattatray Shirole', mobile: '+91 98222 11223', email: 'datta@pimpriaspares.in', business_name: 'Pimpri Auto Spares & Fasteners', gst_no: '27AAACP3321P1Z8', type: 'Wholesale', address: 'Chakan Industrial Corridor, Pune, Maharashtra 410501', status: 'Active', follow_up_date: '2026-11-17', notes: 'Supplies automotive OEM assembly lines in Chakan belt.' },
  { name: 'Chirag Prajapati', mobile: '+91 98252 88990', email: 'chirag@gandhinagarpower.com', business_name: 'Gandhinagar Solar & Power Grid EPC', gst_no: '24AAACG6651G1Z4', type: 'Distributor', address: 'Electronic Estate, Sector 26, Gandhinagar, Gujarat 382024', status: 'Active', follow_up_date: '2026-11-23', notes: 'Turnkey solar installation firm purchasing high-capacity disconnect switches and DC cables.' },
  { name: 'Nilesh Dave', mobile: '+91 98253 44556', email: 'nilesh@ankleshwarvalve.co.in', business_name: 'Ankleshwar Chemical Valve & Pipes', gst_no: '24AAACA1190A1Z7', type: 'Wholesale', address: 'GIDC Industrial Area, Ankleshwar, Gujarat 393002', status: 'Active', follow_up_date: '2026-11-18', notes: 'Procures chemical-resistant gaskets, SS316 fasteners, and safety showers.' },
  { name: 'G. Balasubramanian', mobile: '+91 94433 55667', email: 'bala@salemsteel.in', business_name: 'Salem Steel & Industrial Alloys', gst_no: '33AAACS8871S1Z2', type: 'Distributor', address: 'Junction Main Road, Salem, Tamil Nadu 636005', status: 'Active', follow_up_date: '2026-11-26', notes: 'Regional steel stockist distributing heavy grinding wheels and safety shoes.' },
  { name: 'N. Krishnamoorthy', mobile: '+91 94434 22331', email: 'n.krishna@trichyhardware.com', business_name: 'Tiruchirappalli Heavy Boiler Hardware', gst_no: '33AAACT4431T1Z9', type: 'Wholesale', address: 'Thuvakudi Industrial Area, Tiruchirappalli, Tamil Nadu 620015', status: 'Active', follow_up_date: '2026-11-11', notes: 'BHEL vendor ecosystem contractor. High compliance on product test certificates.' },
  { name: 'Dinesh Shenoy', mobile: '+91 98454 99002', email: 'dinesh@mangalurucoastal.com', business_name: 'Mangaluru Coastal Marine Logistics', gst_no: '29AAACM7761M1Z1', type: 'Distributor', address: 'Baikampady Industrial Area, Mangaluru, Karnataka 575011', status: 'Active', follow_up_date: '2026-11-27', notes: 'Port handling and cold storage maintenance equipment supplier.' },
  { name: 'Raghavendra Prasad', mobile: '+91 98455 11883', email: 'raghav@mysurutools.in', business_name: 'Mysuru Heritage Workshop & Tools', gst_no: '29AAACM2231M1Z3', type: 'Retail', address: 'Sayyaji Rao Road, Mysuru, Karnataka 570001', status: 'Active', follow_up_date: '2026-11-07', notes: 'Woodworking tools, cordless drills, and workshop safety PPE.' },
  { name: 'Pradeep Roy', mobile: '+91 98320 66774', email: 'pradeep@siligurihub.com', business_name: 'Siliguri North-East Trading Hub', gst_no: '19AAACS3341S1Z8', type: 'Wholesale', address: 'Sevoke Road, Siliguri, West Bengal 734001', status: 'Active', follow_up_date: '2026-11-15', notes: 'Gateway to North-East industrial supplies. Tea garden machinery maintenance.' },
  { name: 'Subhashish Mukherjee', mobile: '+91 98311 22339', email: 'subhash@durgapurancillary.in', business_name: 'Durgapur Steel Plant Ancillary Stores', gst_no: '19AAACD9981D1Z5', type: 'Wholesale', address: 'Industrial Area, Durgapur, West Bengal 713212', status: 'Active', follow_up_date: '2026-11-19', notes: 'Heavy duty welding equipment and high-temperature protective gear.' },
  { name: 'Thomas Varghese', mobile: '+91 98460 77881', email: 'thomas@kochishipyardspares.com', business_name: 'Kochi Shipyard & Marine Fitouts', gst_no: '32AAACK5541K1Z7', type: 'Distributor', address: 'Willingdon Island, Kochi, Kerala 682003', status: 'Active', follow_up_date: '2026-11-28', notes: 'Marine grade stainless hardware, hoists, and explosion-proof lighting.' },
  { name: 'Sreekumar Nair', mobile: '+91 98461 33442', email: 'sree@tvmtechsupplies.in', business_name: 'Thiruvananthapuram Tech Supplies', gst_no: '32AAACT8871T1Z3', type: 'Wholesale', address: 'Technopark Phase 1 Road, Trivandrum, Kerala 695581', status: 'Active', follow_up_date: '2026-11-12', notes: 'Electrical installations, energy meters, and data center wiring conduits.' },
  { name: 'B. Mallaiah', mobile: '+91 98491 55667', email: 'mallaiah@warangalginning.com', business_name: 'Warangal Cotton Ginning Spares', gst_no: '36AAACW1191W1Z6', type: 'Retail', address: 'Enumamula Grain Market Road, Warangal, Telangana 506002', status: 'Active', follow_up_date: '2026-11-08', notes: 'Cotton ginning motor replacements and conveyor belt fasteners.' },
  { name: 'Prasad Chowdary', mobile: '+91 98482 11990', email: 'prasad@vjwhardware.co.in', business_name: 'Vijayawada Thermal Power Hardware', gst_no: '37AAACV3321V1Z9', type: 'Wholesale', address: 'Autonagar Industrial Area, Vijayawada, Andhra Pradesh 520007', status: 'Active', follow_up_date: '2026-11-16', notes: 'Supplies high pressure piping, flange bolts, and torque wrenches.' },
  { name: 'Manoj Kumar Singh', mobile: '+91 94311 88772', email: 'manoj@ranchigear.in', business_name: 'Ranchi Coalfields Industrial Gear', gst_no: '20AAACR4451R1Z4', type: 'Distributor', address: 'Tupudana Industrial Area, Ranchi, Jharkhand 834003', status: 'Active', follow_up_date: '2026-11-29', notes: 'Heavy mining tools, steel-toe footwear, and fall protection harnesses.' },
  { name: 'Arunabh Sen', mobile: '+91 94312 33441', email: 'arunabh@jamshedpurancillary.co.in', business_name: 'Jamshedpur Tata Ancillary Supply', gst_no: '20AAACJ9981J1Z0', type: 'Wholesale', address: 'Adityapur Industrial Area Phase 2, Jamshedpur, Jharkhand 832109', status: 'Active', follow_up_date: '2026-11-21', notes: 'Precision measuring tools and impact wrenches for auto manufacturing.' },
  { name: 'Ashutosh Mohanty', mobile: '+91 94370 55663', email: 'ashutosh@bhubaneswarinfra.in', business_name: 'Bhubaneswar Infra Projects Store', gst_no: '21AAACB6651B1Z2', type: 'Wholesale', address: 'Mancheswar Industrial Estate, Bhubaneswar, Odisha 751010', status: 'Active', follow_up_date: '2026-11-17', notes: 'Infrastructure project supplies, pallet trucks, and site safety barriers.' },
  { name: 'Soumya Ranjan Panda', mobile: '+91 94371 99004', email: 'soumya@cuttackmetal.com', business_name: 'Cuttack Metal Craft & Spares', gst_no: '21AAACC1121C1Z5', type: 'Retail', address: 'Choudwar Industrial Zone, Cuttack, Odisha 754025', status: 'Active', follow_up_date: '2026-11-05', notes: 'Hardware and cutting accessories for small-scale metal fabricating units.' },
  { name: 'Narendra Agrawal', mobile: '+91 94252 44551', email: 'narendra@raipuriron.in', business_name: 'Raipur Sponge Iron Spares & Motors', gst_no: '22AAACR8871R1Z8', type: 'Wholesale', address: 'Urla Industrial Area, Raipur, Chhattisgarh 492003', status: 'Active', follow_up_date: '2026-11-22', notes: 'Purchases induction motors, high-bay lights, and contactors in bulk.' },
  { name: 'Hemen Barua', mobile: '+91 94350 22338', email: 'hemen@guwahatilogistics.com', business_name: 'Guwahati Brahmaputra Logistics Spares', gst_no: '18AAACG3341G1Z1', type: 'Wholesale', address: 'Paltan Bazaar Commercial Center, Guwahati, Assam 781008', status: 'Active', follow_up_date: '2026-11-18', notes: 'River freight material handling gear, slings, and chain blocks.' },
  { name: 'Simranjit Kaur', mobile: '+91 98150 77884', email: 'simran@chandigarhsmartgrid.in', business_name: 'Chandigarh Smart Grid Components', gst_no: '04AAACC7781C1Z3', type: 'Wholesale', address: 'Industrial Area Phase 1, Chandigarh, Union Territory 160002', status: 'Active', follow_up_date: '2026-11-20', notes: 'Modular panels, digital energy meters, and smart switchgear solutions.' },
  { name: 'Ramesh Batra', mobile: '+91 98120 11993', email: 'ramesh@panipathardware.com', business_name: 'Panipat Textile Mill Hardware', gst_no: '06AAACP5541P1Z9', type: 'Retail', address: 'G.T. Road, Panipat, Haryana 132103', status: 'Active', follow_up_date: '2026-11-04', notes: 'Textile spinning mill machine bolts, spanners, and grease guns.' },
  { name: 'Vivek Rastogi', mobile: '+91 98370 66775', email: 'vivek@meerutsportsfit.com', business_name: 'Meerut Sports & Gym Equipment Works', gst_no: '09AAACM1191M1Z2', type: 'Retail', address: 'Delhi Road Industrial Area, Meerut, Uttar Pradesh 250002', status: 'Active', follow_up_date: '2026-11-09', notes: 'Fabrication hardware and pulley blocks for gym equipment manufacturers.' },
  { name: 'Dharmendra Yadav', mobile: '+91 98371 22336', email: 'dharmendra@agrafoundry.in', business_name: 'Agra Foundry & Heavy Lathes', gst_no: '09AAACA7761A1Z4', type: 'Wholesale', address: 'Foundry Nagar, Agra, Uttar Pradesh 282006', status: 'Active', follow_up_date: '2026-11-23', notes: 'Foundry safety equipment, face shields, and heavy bench vises.' },
  
  // Pipeline Leads (10)
  { name: 'Ankit Gupta', mobile: '+91 98390 55661', email: 'ankit@kanpurmachinery.com', business_name: 'Kanpur Leather Machinery Corp', gst_no: '09AAACK4431K1Z7', type: 'Wholesale', address: 'Fazalganj Industrial Estate, Kanpur, Uttar Pradesh 208012', status: 'Lead', follow_up_date: '2026-11-02', notes: 'Lead interested in annual supply of safety boots and industrial sewing motor spares.' },
  { name: 'Santosh Mishra', mobile: '+91 98391 99002', email: 'santosh@varanasipower.in', business_name: 'Varanasi Power Loom Spares', gst_no: '09AAACV8871V1Z3', type: 'Retail', address: 'Chowk Industrial Gali, Varanasi, Uttar Pradesh 221001', status: 'Lead', follow_up_date: '2026-11-03', notes: 'Requested quotation for 50 units of 3-phase contactors and overload relays.' },
  { name: 'Pankaj Tomar', mobile: '+91 98270 44558', email: 'pankaj@gwaliorbearings.com', business_name: 'Gwalior Industrial Bearings', gst_no: '23AAACG3321G1Z6', type: 'Retail', address: 'Maharaj Bada Commercial Complex, Gwalior, Madhya Pradesh 474001', status: 'Lead', follow_up_date: '2026-11-07', notes: 'Needs pricing catalog for hex bolts, spring washers, and Allen screws.' },
  { name: 'Mahendra Singh Rathore', mobile: '+91 94142 88771', email: 'mahendra@udaipurminerals.in', business_name: 'Udaipur Mineral Processing Spares', gst_no: '08AAACU7761U1Z9', type: 'Wholesale', address: 'Sukher Industrial Area, Udaipur, Rajasthan 313001', status: 'Lead', follow_up_date: '2026-11-06', notes: 'Discussing bulk delivery of hydraulic hand pallet trucks and heavy slings.' },
  { name: 'Rajeshwar Sharma', mobile: '+91 94143 33446', email: 'rajeshwar@kotathermal.com', business_name: 'Kota Thermal Plant Contractors', gst_no: '08AAACK1141K1Z5', type: 'Wholesale', address: 'DCM Road, Kota Industrial Area, Kota, Rajasthan 324004', status: 'Lead', follow_up_date: '2026-11-12', notes: 'Tender qualification in progress for high-temperature PPE and respirators.' },
  { name: 'Jagdish Prasad', mobile: '+91 94144 77882', email: 'jagdish@alwartools.in', business_name: 'Alwar Industrial Estate Tools', gst_no: '08AAACA5531A1Z8', type: 'Retail', address: 'Matsya Industrial Area, Alwar, Rajasthan 301030', status: 'Lead', follow_up_date: '2026-11-14', notes: 'Inquired about becoming an authorized dealer for Bosch and Makita power tools.' },
  { name: 'Balasaheb Kore', mobile: '+91 98223 66551', email: 'balasaheb@solapurpump.in', business_name: 'Solapur Textile & Pump Mart', gst_no: '27AAACS8891S1Z4', type: 'Retail', address: 'Old MIDC Area, Solapur, Maharashtra 413006', status: 'Lead', follow_up_date: '2026-11-15', notes: 'Requested sample batch of waterproof floodlights and cable conduits.' },
  { name: 'Sambhaji Patil', mobile: '+91 98224 22119', email: 'sambhaji@kolhapursugar.co.in', business_name: 'Kolhapur Sugar Mill Spares', gst_no: '27AAACK3341K1Z7', type: 'Wholesale', address: 'Shiroli MIDC, Kolhapur, Maharashtra 416122', status: 'Lead', follow_up_date: '2026-11-18', notes: 'Preparing annual pre-crushing maintenance order for chain pulley blocks.' },
  { name: 'Farhan Ansari', mobile: '+91 98204 88992', email: 'farhan@bhiwandiracks.in', business_name: 'Bhiwandi Logistics & Material Racks', gst_no: '27AAACB7761B1Z0', type: 'Wholesale', address: 'Anjurphata Road, Bhiwandi, Maharashtra 421302', status: 'Inactive', follow_up_date: null, notes: 'Account temporarily inactive pending credit limit reassessment.' },
  { name: 'Jayantilal Patel', mobile: '+91 98254 33227', email: 'jayantilal@morbiceramic.com', business_name: 'Morbi Ceramic Machinery Spares', gst_no: '24AAACM1121M1Z3', type: 'Distributor', address: '8-A National Highway, Morbi, Gujarat 363642', status: 'Inactive', follow_up_date: null, notes: 'Previous fiscal year distributor; awaiting renewal of partnership terms.' },
];

// Assign IDs and timestamps
const customers: Customer[] = rawCustomers.map((c, idx) => ({
  ...c,
  id: idx + 1,
  created_at: new Date(Date.parse('2026-04-15T09:00:00Z') + idx * 86400000 * 2).toISOString(),
}));

// 2. Raw Products (80)
interface RawProduct {
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  min_stock_alert: number;
  location: string;
  initial_in: number;
  restock_in: number;
  target_low_stock?: boolean;
  target_out_of_stock?: boolean;
}

const rawProducts: RawProduct[] = [
  // 1. Electrical & Switchgear (16)
  { name: 'Havells 32A Triple Pole MCB C-Curve', sku: 'SKU-ELE-001', category: 'Electrical & Switchgear', unit_price: 1450, min_stock_alert: 15, location: 'Bay A - Rack 01 - Shelf 1', initial_in: 85, restock_in: 30 },
  { name: 'Schneider 63A 4-Pole RCCB 30mA', sku: 'SKU-ELE-002', category: 'Electrical & Switchgear', unit_price: 3850, min_stock_alert: 10, location: 'Bay A - Rack 01 - Shelf 2', initial_in: 50, restock_in: 20 },
  { name: 'L&T 3-Phase Contactor 25A 220V Coil', sku: 'SKU-ELE-003', category: 'Electrical & Switchgear', unit_price: 2650, min_stock_alert: 12, location: 'Bay A - Rack 01 - Shelf 3', initial_in: 60, restock_in: 25 },
  { name: 'Polycab 4 Sq mm 3-Core Copper Armoured Cable (100m)', sku: 'SKU-ELE-004', category: 'Electrical & Switchgear', unit_price: 11200, min_stock_alert: 5, location: 'Bay A - Rack 02 - Floor', initial_in: 32, restock_in: 10 },
  { name: 'Finolex 2.5 Sq mm FR Multistrand Wire Red (90m)', sku: 'SKU-ELE-005', category: 'Electrical & Switchgear', unit_price: 2890, min_stock_alert: 25, location: 'Bay A - Rack 02 - Shelf 1', initial_in: 140, restock_in: 60 },
  { name: 'Finolex 2.5 Sq mm FR Multistrand Wire Blue (90m)', sku: 'SKU-ELE-006', category: 'Electrical & Switchgear', unit_price: 2890, min_stock_alert: 25, location: 'Bay A - Rack 02 - Shelf 1', initial_in: 140, restock_in: 50 },
  { name: 'Philips 100W High-Bay Industrial LED Light', sku: 'SKU-ELE-007', category: 'Electrical & Switchgear', unit_price: 4250, min_stock_alert: 10, location: 'Bay A - Rack 03 - Shelf 2', initial_in: 65, restock_in: 25 },
  { name: 'Crompton 150W IP66 Waterproof Flood Light', sku: 'SKU-ELE-008', category: 'Electrical & Switchgear', unit_price: 5600, min_stock_alert: 8, location: 'Bay A - Rack 03 - Shelf 3', initial_in: 45, restock_in: 15 },
  { name: 'Legrand 63A Industrial Isolator Switch', sku: 'SKU-ELE-009', category: 'Electrical & Switchgear', unit_price: 1980, min_stock_alert: 15, location: 'Bay A - Rack 04 - Shelf 1', initial_in: 80, restock_in: 25 },
  { name: 'Anchor Roma Modular Switch Panel 8-Module', sku: 'SKU-ELE-010', category: 'Electrical & Switchgear', unit_price: 780, min_stock_alert: 30, location: 'Bay A - Rack 04 - Shelf 2', initial_in: 170, restock_in: 60 },
  { name: 'Selec Digital Panel Multifunction Energy Meter', sku: 'SKU-ELE-011', category: 'Electrical & Switchgear', unit_price: 4900, min_stock_alert: 8, location: 'Bay A - Rack 05 - Shelf 1', initial_in: 38, restock_in: 12 },
  { name: 'Siemens Overload Relay 10-16A Range', sku: 'SKU-ELE-012', category: 'Electrical & Switchgear', unit_price: 3150, min_stock_alert: 12, location: 'Bay A - Rack 05 - Shelf 2', initial_in: 55, restock_in: 15 },
  { name: 'Copper Busbar 25x5mm Tin-Plated (2m Bar)', sku: 'SKU-ELE-013', category: 'Electrical & Switchgear', unit_price: 1950, min_stock_alert: 15, location: 'Bay A - Rack 05 - Floor', initial_in: 80, restock_in: 25 },
  { name: 'Heavy Duty PVC Conduit Pipe 25mm (Bundle of 10)', sku: 'SKU-ELE-014', category: 'Electrical & Switchgear', unit_price: 1650, min_stock_alert: 20, location: 'Bay A - Rack 06 - Floor', initial_in: 100, restock_in: 35 },
  { name: 'Industrial Cable Gland Brass Nickelled 32mm (Pack of 10)', sku: 'SKU-ELE-015', category: 'Electrical & Switchgear', unit_price: 850, min_stock_alert: 20, location: 'Bay A - Rack 06 - Shelf 2', initial_in: 125, restock_in: 45 },
  { name: 'Automatic Phase Changer 40A 3-Phase', sku: 'SKU-ELE-016', category: 'Electrical & Switchgear', unit_price: 6400, min_stock_alert: 6, location: 'Bay A - Rack 06 - Shelf 3', initial_in: 28, restock_in: 10 },

  // 2. Industrial Hardware & Fasteners (16)
  { name: 'Grade 8.8 High Tensile Hex Bolt M12x50 (Box of 100)', sku: 'SKU-FAS-001', category: 'Industrial Hardware & Fasteners', unit_price: 1250, min_stock_alert: 25, location: 'Bay B - Rack 01 - Shelf 1', initial_in: 160, restock_in: 60 },
  { name: 'SS 304 Stainless Steel Hex Nut M12 (Box of 200)', sku: 'SKU-FAS-002', category: 'Industrial Hardware & Fasteners', unit_price: 950, min_stock_alert: 30, location: 'Bay B - Rack 01 - Shelf 2', initial_in: 180, restock_in: 70 },
  { name: 'Heavy Duty Wedge Anchor M16x150 Zinc Plated (Box of 50)', sku: 'SKU-FAS-003', category: 'Industrial Hardware & Fasteners', unit_price: 2450, min_stock_alert: 15, location: 'Bay B - Rack 01 - Shelf 3', initial_in: 90, restock_in: 35 },
  { name: 'Self-Drilling Screws with EPDM Washer 12x25 (Box of 500)', sku: 'SKU-FAS-004', category: 'Industrial Hardware & Fasteners', unit_price: 1150, min_stock_alert: 30, location: 'Bay B - Rack 02 - Shelf 1', initial_in: 200, restock_in: 80 },
  { name: 'Slotted Galvanized Angle Channel 40x40x3mm (3m)', sku: 'SKU-FAS-005', category: 'Industrial Hardware & Fasteners', unit_price: 890, min_stock_alert: 20, location: 'Bay B - Rack 02 - Floor', initial_in: 125, restock_in: 45 },
  { name: 'MS Threaded Rod M16 Grade 4.6 (1 Meter Length)', sku: 'SKU-FAS-006', category: 'Industrial Hardware & Fasteners', unit_price: 280, min_stock_alert: 40, location: 'Bay B - Rack 02 - Floor', initial_in: 260, restock_in: 90 },
  { name: 'SS 316 Heavy Duty Hose Clamp 2-inch (Pack of 25)', sku: 'SKU-FAS-007', category: 'Industrial Hardware & Fasteners', unit_price: 1450, min_stock_alert: 15, location: 'Bay B - Rack 03 - Shelf 1', initial_in: 100, restock_in: 35 },
  { name: 'Industrial Blind Rivets 4.8x12mm Aluminium (Box of 1000)', sku: 'SKU-FAS-008', category: 'Industrial Hardware & Fasteners', unit_price: 820, min_stock_alert: 25, location: 'Bay B - Rack 03 - Shelf 2', initial_in: 145, restock_in: 55 },
  { name: 'High Pressure Hydraulic Pipe Flange 3-inch ANSI 150', sku: 'SKU-FAS-009', category: 'Industrial Hardware & Fasteners', unit_price: 3200, min_stock_alert: 10, location: 'Bay B - Rack 03 - Shelf 3', initial_in: 50, restock_in: 18 },
  { name: 'Drop-In Expansion Shield Anchors M10 (Box of 100)', sku: 'SKU-FAS-010', category: 'Industrial Hardware & Fasteners', unit_price: 750, min_stock_alert: 20, location: 'Bay B - Rack 04 - Shelf 1', initial_in: 115, restock_in: 45 },
  { name: 'Stainless Steel Spring Washers M10 (Box of 500)', sku: 'SKU-FAS-011', category: 'Industrial Hardware & Fasteners', unit_price: 540, min_stock_alert: 25, location: 'Bay B - Rack 04 - Shelf 2', initial_in: 155, restock_in: 55 },
  { name: 'Heavy Duty Mild Steel Eye Bolt M20 (Pack of 4)', sku: 'SKU-FAS-012', category: 'Industrial Hardware & Fasteners', unit_price: 1350, min_stock_alert: 12, location: 'Bay B - Rack 04 - Shelf 3', initial_in: 70, restock_in: 25 },
  { name: 'Industrial Gasket Sheet Non-Asbestos 2mm (1m x 1m)', sku: 'SKU-FAS-013', category: 'Industrial Hardware & Fasteners', unit_price: 2100, min_stock_alert: 10, location: 'Bay B - Rack 05 - Shelf 1', initial_in: 55, restock_in: 22 },
  { name: 'Zinc Plated U-Bolt for 4-inch Pipe (Pack of 10)', sku: 'SKU-FAS-014', category: 'Industrial Hardware & Fasteners', unit_price: 1100, min_stock_alert: 15, location: 'Bay B - Rack 05 - Shelf 2', initial_in: 90, restock_in: 35 },
  { name: 'High Tensile Allen Socket Cap Screw M8x40 (Box of 100)', sku: 'SKU-FAS-015', category: 'Industrial Hardware & Fasteners', unit_price: 680, min_stock_alert: 20, location: 'Bay B - Rack 05 - Shelf 3', initial_in: 125, restock_in: 45 },
  { name: 'Cast Iron Pipe Clamps with Rubber Cushion 2-inch (Pack of 20)', sku: 'SKU-FAS-016', category: 'Industrial Hardware & Fasteners', unit_price: 1400, min_stock_alert: 15, location: 'Bay B - Rack 06 - Shelf 1', initial_in: 95, restock_in: 30 },

  // 3. Safety & PPE (16)
  { name: 'Karam ISI Approved Industrial Safety Helmet Yellow', sku: 'SKU-SAF-001', category: 'Safety & PPE', unit_price: 340, min_stock_alert: 40, location: 'Bay C - Rack 01 - Shelf 1', initial_in: 230, restock_in: 90 },
  { name: 'Karam High-Altitude Full Body Fall Arrest Harness', sku: 'SKU-SAF-002', category: 'Safety & PPE', unit_price: 2850, min_stock_alert: 12, location: 'Bay C - Rack 01 - Shelf 2', initial_in: 70, restock_in: 25 },
  { name: 'Allen Cooper Steel Toe Leather Safety Shoes (Size 9)', sku: 'SKU-SAF-003', category: 'Safety & PPE', unit_price: 2450, min_stock_alert: 15, location: 'Bay C - Rack 02 - Shelf 1', initial_in: 90, restock_in: 35 },
  { name: 'Tiger ISI Certified Men Safety Shoes (Size 8)', sku: 'SKU-SAF-004', category: 'Safety & PPE', unit_price: 1690, min_stock_alert: 20, location: 'Bay C - Rack 02 - Shelf 2', initial_in: 110, restock_in: 40 },
  { name: '3M 9004V Dust & Mist Respirator Mask (Pack of 50)', sku: 'SKU-SAF-005', category: 'Safety & PPE', unit_price: 1850, min_stock_alert: 30, location: 'Bay C - Rack 03 - Shelf 1', initial_in: 175, restock_in: 70 },
  { name: 'Heat Resistant Split Leather Welding Gloves (Pack of 10)', sku: 'SKU-SAF-006', category: 'Safety & PPE', unit_price: 2200, min_stock_alert: 20, location: 'Bay C - Rack 03 - Shelf 2', initial_in: 105, restock_in: 35 },
  { name: '3M Anti-Scratch Clear Safety Spectacles (Pack of 20)', sku: 'SKU-SAF-007', category: 'Safety & PPE', unit_price: 2400, min_stock_alert: 20, location: 'Bay C - Rack 03 - Shelf 3', initial_in: 115, restock_in: 45 },
  { name: 'High Visibility Reflective Safety Jacket Neon Orange (Pack of 10)', sku: 'SKU-SAF-008', category: 'Safety & PPE', unit_price: 1500, min_stock_alert: 25, location: 'Bay C - Rack 04 - Shelf 1', initial_in: 145, restock_in: 55 },
  { name: 'Honeywell Polycarbonate Face Shield with Browguard', sku: 'SKU-SAF-009', category: 'Safety & PPE', unit_price: 890, min_stock_alert: 15, location: 'Bay C - Rack 04 - Shelf 2', initial_in: 80, restock_in: 30 },
  { name: 'Heavy Duty Chemical Resistant Nitrile Gauntlets (Pack of 12)', sku: 'SKU-SAF-010', category: 'Safety & PPE', unit_price: 1950, min_stock_alert: 15, location: 'Bay C - Rack 04 - Shelf 3', initial_in: 85, restock_in: 30 },
  { name: '3M Reusable Silicon Ear Plugs with Cord (Box of 50)', sku: 'SKU-SAF-011', category: 'Safety & PPE', unit_price: 1250, min_stock_alert: 20, location: 'Bay C - Rack 05 - Shelf 1', initial_in: 125, restock_in: 45 },
  { name: 'ABC Dry Powder Fire Extinguisher 6kg ISI', sku: 'SKU-SAF-012', category: 'Safety & PPE', unit_price: 2150, min_stock_alert: 12, location: 'Bay C - Rack 05 - Shelf 2', initial_in: 70, restock_in: 25 },
  { name: 'CO2 Fire Extinguisher 4.5kg with Wheel & Horn', sku: 'SKU-SAF-013', category: 'Safety & PPE', unit_price: 5400, min_stock_alert: 8, location: 'Bay C - Rack 05 - Floor', initial_in: 40, restock_in: 12 },
  { name: 'Industrial Spill Response Containment Kit 50L', sku: 'SKU-SAF-014', category: 'Safety & PPE', unit_price: 4800, min_stock_alert: 6, location: 'Bay C - Rack 06 - Shelf 1', initial_in: 28, restock_in: 12 },
  { name: 'Wall-Mounted Emergency Eye Wash Station', sku: 'SKU-SAF-015', category: 'Safety & PPE', unit_price: 3600, min_stock_alert: 8, location: 'Bay C - Rack 06 - Shelf 2', initial_in: 35, restock_in: 12 },
  { name: 'Caution Danger Barricade Tape 3-inch x 300m (Pack of 4)', sku: 'SKU-SAF-016', category: 'Safety & PPE', unit_price: 680, min_stock_alert: 25, location: 'Bay C - Rack 06 - Shelf 3', initial_in: 140, restock_in: 45 },

  // 4. Tools & Machinery (16)
  { name: 'Bosch 800W Professional Rotary Hammer Drill GBH 2-26', sku: 'SKU-TOL-001', category: 'Tools & Machinery', unit_price: 9850, min_stock_alert: 8, location: 'Bay D - Rack 01 - Shelf 1', initial_in: 40, restock_in: 15 },
  { name: 'Makita 4-inch Heavy Duty Angle Grinder 840W', sku: 'SKU-TOL-002', category: 'Tools & Machinery', unit_price: 4200, min_stock_alert: 12, location: 'Bay D - Rack 01 - Shelf 2', initial_in: 60, restock_in: 25 },
  { name: 'DeWalt 20V Max Brushless Cordless Impact Drill', sku: 'SKU-TOL-003', category: 'Tools & Machinery', unit_price: 14500, min_stock_alert: 6, location: 'Bay D - Rack 01 - Shelf 3', initial_in: 32, restock_in: 12 },
  { name: 'Stanley 150-Piece Master Mechanics Tool Set', sku: 'SKU-TOL-004', category: 'Tools & Machinery', unit_price: 12900, min_stock_alert: 8, location: 'Bay D - Rack 02 - Shelf 1', initial_in: 36, restock_in: 14 },
  { name: 'Taparia Heavy Duty Bench Vise 6-inch Swivel Base', sku: 'SKU-TOL-005', category: 'Tools & Machinery', unit_price: 5800, min_stock_alert: 8, location: 'Bay D - Rack 02 - Floor', initial_in: 40, restock_in: 18 },
  { name: 'Insize Vernier Digital Caliper 0-150mm Stainless', sku: 'SKU-TOL-006', category: 'Tools & Machinery', unit_price: 3100, min_stock_alert: 10, location: 'Bay D - Rack 02 - Shelf 3', initial_in: 50, restock_in: 18 },
  { name: 'Kirloskar 3-Phase Induction Motor 3HP 1440RPM', sku: 'SKU-TOL-007', category: 'Tools & Machinery', unit_price: 18400, min_stock_alert: 5, location: 'Bay D - Rack 03 - Floor', initial_in: 24, restock_in: 8 },
  { name: 'ESAB 200A Inverter Arc Welding Machine', sku: 'SKU-TOL-008', category: 'Tools & Machinery', unit_price: 16900, min_stock_alert: 5, location: 'Bay D - Rack 03 - Shelf 2', initial_in: 25, restock_in: 10 },
  { name: 'Pneumatic Air Impact Wrench 1/2-inch Drive 650Nm', sku: 'SKU-TOL-009', category: 'Tools & Machinery', unit_price: 7250, min_stock_alert: 8, location: 'Bay D - Rack 04 - Shelf 1', initial_in: 40, restock_in: 15 },
  { name: 'Heavy Duty Hydraulic Hand Pipe Bender 1/2 to 2-inch', sku: 'SKU-TOL-010', category: 'Tools & Machinery', unit_price: 15800, min_stock_alert: 4, location: 'Bay D - Rack 04 - Floor', initial_in: 20, restock_in: 6 },
  { name: 'Fluke 101 Pocket Digital Multimeter CAT III', sku: 'SKU-TOL-011', category: 'Tools & Machinery', unit_price: 4350, min_stock_alert: 10, location: 'Bay D - Rack 04 - Shelf 3', initial_in: 50, restock_in: 18 },
  { name: 'Taparia Adjustable Torque Wrench 40-200Nm', sku: 'SKU-TOL-012', category: 'Tools & Machinery', unit_price: 4900, min_stock_alert: 8, location: 'Bay D - Rack 05 - Shelf 1', initial_in: 42, restock_in: 14 },
  { name: 'Industrial Two-Stage Air Compressor Pump 3HP', sku: 'SKU-TOL-013', category: 'Tools & Machinery', unit_price: 26500, min_stock_alert: 4, location: 'Bay D - Rack 05 - Floor', initial_in: 18, restock_in: 6 },
  { name: 'Magnetic Base Dial Indicator Gauge 0-10mm', sku: 'SKU-TOL-014', category: 'Tools & Machinery', unit_price: 2750, min_stock_alert: 10, location: 'Bay D - Rack 05 - Shelf 3', initial_in: 45, restock_in: 18 },
  { name: 'Heavy Duty Benchtop Drill Press 16mm Chuck', sku: 'SKU-TOL-015', category: 'Tools & Machinery', unit_price: 21500, min_stock_alert: 4, location: 'Bay D - Rack 06 - Floor', initial_in: 18, restock_in: 6 },
  { name: 'Taparia 12-Piece Double Ended Ring Spanner Set', sku: 'SKU-TOL-016', category: 'Tools & Machinery', unit_price: 1850, min_stock_alert: 15, location: 'Bay D - Rack 06 - Shelf 2', initial_in: 85, restock_in: 30 },

  // 5. Material Handling & Storage (16)
  { name: 'Heavy Duty Hydraulic Hand Pallet Truck 2.5 Ton', sku: 'SKU-MHS-001', category: 'Material Handling & Storage', unit_price: 22500, min_stock_alert: 5, location: 'Bay E - Yard - Bay 1', initial_in: 28, restock_in: 10 },
  { name: 'Nilkamal Heavy Duty Industrial Plastic Crate 50L (Pack of 5)', sku: 'SKU-MHS-002', category: 'Material Handling & Storage', unit_price: 2750, min_stock_alert: 20, location: 'Bay E - Rack 01 - Shelf 1', initial_in: 115, restock_in: 45 },
  { name: 'Swivel PU Caster Wheel 6-inch 350kg Capacity (Set of 4)', sku: 'SKU-MHS-003', category: 'Material Handling & Storage', unit_price: 3400, min_stock_alert: 15, location: 'Bay E - Rack 01 - Shelf 2', initial_in: 90, restock_in: 35 },
  { name: 'Electric Chain Hoist 1 Ton with Wireless Remote', sku: 'SKU-MHS-004', category: 'Material Handling & Storage', unit_price: 38500, min_stock_alert: 3, location: 'Bay E - Rack 02 - Floor', initial_in: 14, restock_in: 5 },
  { name: 'Heavy Duty Steel Platform Trolley 500kg Load', sku: 'SKU-MHS-005', category: 'Material Handling & Storage', unit_price: 6800, min_stock_alert: 8, location: 'Bay E - Rack 02 - Floor', initial_in: 40, restock_in: 15 },
  { name: 'Industrial Cantilever Storage Rack Upright 3m', sku: 'SKU-MHS-006', category: 'Material Handling & Storage', unit_price: 14200, min_stock_alert: 5, location: 'Bay E - Rack 03 - Floor', initial_in: 25, restock_in: 10 },
  { name: 'Manual Chain Pulley Block 3 Ton 3m Lift', sku: 'SKU-MHS-007', category: 'Material Handling & Storage', unit_price: 8900, min_stock_alert: 6, location: 'Bay E - Rack 03 - Shelf 2', initial_in: 32, restock_in: 12 },
  { name: 'Heavy Duty Ratchet Tie-Down Straps 50mm x 10m 5T (Pack of 4)', sku: 'SKU-MHS-008', category: 'Material Handling & Storage', unit_price: 2800, min_stock_alert: 15, location: 'Bay E - Rack 03 - Shelf 3', initial_in: 85, restock_in: 30 },
  { name: 'Stackable Metal Storage Bins Wire Mesh 800kg', sku: 'SKU-MHS-009', category: 'Material Handling & Storage', unit_price: 5600, min_stock_alert: 8, location: 'Bay E - Rack 04 - Floor', initial_in: 40, restock_in: 15 },
  { name: 'Hydraulic Scissor Lift Table Mobile 500kg', sku: 'SKU-MHS-010', category: 'Material Handling & Storage', unit_price: 34000, min_stock_alert: 3, location: 'Bay E - Yard - Bay 2', initial_in: 16, restock_in: 5 },
  { name: 'Polyester Webbing Sling Belt 3 Ton 6 Meter (Pack of 2)', sku: 'SKU-MHS-011', category: 'Material Handling & Storage', unit_price: 1950, min_stock_alert: 15, location: 'Bay E - Rack 04 - Shelf 2', initial_in: 90, restock_in: 35 },
  { name: 'Nilkamal HDPE Heavy Duty 4-Way Entry Pallet', sku: 'SKU-MHS-012', category: 'Material Handling & Storage', unit_price: 3200, min_stock_alert: 15, location: 'Bay E - Rack 05 - Floor', initial_in: 100, restock_in: 40 },
  { name: 'Industrial Tool Storage Trolley Cabinet 7-Drawer', sku: 'SKU-MHS-013', category: 'Material Handling & Storage', unit_price: 24800, min_stock_alert: 4, location: 'Bay E - Rack 05 - Floor', initial_in: 20, restock_in: 8 },
  { name: 'Heavy Duty Drum Lifter cum Tilter Trolley 300kg', sku: 'SKU-MHS-014', category: 'Material Handling & Storage', unit_price: 18900, min_stock_alert: 4, location: 'Bay E - Rack 06 - Floor', initial_in: 18, restock_in: 6 },
  { name: 'Heavy Duty Pallet Truck Nylon Steer Wheel Set', sku: 'SKU-MHS-015', category: 'Material Handling & Storage', unit_price: 1650, min_stock_alert: 15, location: 'Bay E - Rack 06 - Shelf 2', initial_in: 90, restock_in: 30 },
  { name: 'Wall-Mounted Heavy Duty Hose Reel Auto-Retract 20m', sku: 'SKU-MHS-016', category: 'Material Handling & Storage', unit_price: 7500, min_stock_alert: 6, location: 'Bay E - Rack 06 - Shelf 3', initial_in: 35, restock_in: 12 },
];

// Initialize products with id and base properties
const products: Product[] = rawProducts.map((p, idx) => ({
  id: idx + 1,
  name: p.name,
  sku: p.sku,
  category: p.category,
  unit_price: p.unit_price,
  min_stock_alert: p.min_stock_alert,
  location: p.location,
  current_stock: 0, // to be calculated from movements
  created_at: new Date(Date.parse('2026-05-01T08:00:00Z')).toISOString(),
}));

// We want 150 Orders spread across May 05 to Oct 28, 2026
// Status mix:
// ~104 Confirmed (orders that succeeded and deducted stock)
// ~32 Draft (pending quotes/leads, no stock deducted)
// ~14 Cancelled (orders that were confirmed then cancelled, restoring stock)

interface GeneratedOrderPlan {
  order_number: string;
  customer_id: number;
  status: 'Draft' | 'Confirmed' | 'Cancelled';
  created_by: number;
  created_at: string;
  cancel_at?: string;
  items: Array<{ product_id: number; quantity: number }>;
}

// Deterministic LCG pseudo-random number generator
let seed = 123456789;
function pseudoRandom() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}

const TOTAL_ORDERS = 150;
const startTimestamp = Date.parse('2026-05-05T09:00:00Z');
const endTimestamp = Date.parse('2026-10-28T18:00:00Z');
const durationMs = endTimestamp - startTimestamp;

const orderPlans: GeneratedOrderPlan[] = [];

for (let i = 0; i < TOTAL_ORDERS; i++) {
  // Deterministic order timestamp distributed over the 176 days
  const progress = i / TOTAL_ORDERS;
  // slight randomness around the progress
  const jitter = (pseudoRandom() - 0.5) * 86400000 * 2;
  const orderTimeMs = Math.min(endTimestamp, Math.max(startTimestamp, startTimestamp + progress * durationMs + jitter));
  const orderDate = new Date(orderTimeMs);
  
  const yyyy = orderDate.getUTCFullYear();
  const mm = String(orderDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(orderDate.getUTCDate()).padStart(2, '0');
  const seq = String(i + 1).padStart(4, '0');
  const order_number = `ORD-${yyyy}${mm}${dd}-${seq}`;

  // Customer selection: first 55 are active customers, high probability of returning customers
  // active customer indices 0..54 (IDs 1..55)
  // lead customer indices 55..62 (IDs 56..63)
  const isLead = pseudoRandom() < 0.08;
  const custIndex = isLead 
    ? 55 + Math.floor(pseudoRandom() * 8) // IDs 56..63
    : Math.floor(pseudoRandom() * 55);    // IDs 1..55
  const customer_id = customers[custIndex].id;

  // Status selection:
  // If customer is lead, usually draft
  let status: 'Draft' | 'Confirmed' | 'Cancelled';
  if (isLead) {
    status = pseudoRandom() < 0.75 ? 'Draft' : 'Confirmed';
  } else {
    const roll = pseudoRandom();
    if (roll < 0.70) {
      status = 'Confirmed';
    } else if (roll < 0.90) {
      status = 'Draft';
    } else {
      status = 'Cancelled';
    }
  }

  // Pick 1 to 4 distinct items
  const itemCount = 1 + Math.floor(pseudoRandom() * 3.2); // 1, 2, 3, or 4
  const pickedProducts = new Set<number>();
  const items: Array<{ product_id: number; quantity: number }> = [];

  for (let j = 0; j < itemCount; j++) {
    let prodId: number;
    do {
      prodId = 1 + Math.floor(pseudoRandom() * products.length);
    } while (pickedProducts.has(prodId));
    pickedProducts.add(prodId);

    const prod = products[prodId - 1];
    // Quantity depends on price:
    // unit_price > 10000: 1 to 3
    // unit_price > 3000: 2 to 6
    // unit_price <= 3000: 5 to 20
    let qty: number;
    if (prod.unit_price > 15000) {
      qty = 1 + Math.floor(pseudoRandom() * 2); // 1 or 2
    } else if (prod.unit_price > 5000) {
      qty = 1 + Math.floor(pseudoRandom() * 4); // 1 to 4
    } else if (prod.unit_price > 1500) {
      qty = 2 + Math.floor(pseudoRandom() * 6); // 2 to 7
    } else {
      qty = 5 + Math.floor(pseudoRandom() * 12); // 5 to 16
    }

    items.push({ product_id: prodId, quantity: qty });
  }

  const cancel_at = status === 'Cancelled'
    ? new Date(orderTimeMs + 86400000 * (1 + Math.floor(pseudoRandom() * 3))).toISOString()
    : undefined;

  orderPlans.push({
    order_number,
    customer_id,
    status,
    created_by: pseudoRandom() < 0.85 ? 2 : 1, // Sales user (2) or Admin (1)
    created_at: orderDate.toISOString(),
    cancel_at,
    items,
  });
}

console.log(`Generated ${orderPlans.length} order plans.`);

// Reconcile Stock Movements:
// 1. Initial Inbound on May 01, 2026
// 2. Mid-term Inbound on July 15, 2026 and Sept 01, 2026
// 3. Outbound on Confirmed orders
// 4. Outbound on Cancelled orders when placed, then Inbound when cancelled!
const stockMovements: StockMovement[] = [];
let movementIdSeq = 1;

// 1. Initial inbound movements
for (const rawP of rawProducts) {
  const prod = products.find(p => p.sku === rawP.sku)!;
  stockMovements.push({
    id: movementIdSeq++,
    product_id: prod.id,
    product_name: prod.name,
    sku: prod.sku,
    quantity_changed: rawP.initial_in,
    movement_type: 'IN',
    reason: `Initial PO procurement intake batch-2026-Q2 from manufacturer`,
    created_by: 3, // Warehouse Officer
    created_by_name: 'Warehouse Officer',
    created_at: '2026-05-01T08:30:00.000Z',
  });
}

// 2. Mid-term restock movements for high demand items
for (const rawP of rawProducts) {
  const prod = products.find(p => p.sku === rawP.sku)!;
  stockMovements.push({
    id: movementIdSeq++,
    product_id: prod.id,
    product_name: prod.name,
    sku: prod.sku,
    quantity_changed: rawP.restock_in,
    movement_type: 'IN',
    reason: `Mid-season replenishment PO-2026-0819 received from OEM`,
    created_by: 3, // Warehouse Officer
    created_by_name: 'Warehouse Officer',
    created_at: '2026-07-28T10:15:00.000Z',
  });
}

// 3. Process order items and create stock movements
const orders: Order[] = [];
const allOrderItems: OrderItem[] = [];
let orderItemIdSeq = 1;

for (let i = 0; i < orderPlans.length; i++) {
  const plan = orderPlans[i];
  const orderId = i + 1;
  const cust = customers.find(c => c.id === plan.customer_id)!;

  const currentOrderItems: OrderItem[] = [];
  let orderTotalQty = 0;
  let orderTotalAmount = 0;

  for (const itemPlan of plan.items) {
    const prod = products.find(p => p.id === itemPlan.product_id)!;
    const item: OrderItem = {
      id: orderItemIdSeq++,
      order_id: orderId,
      product_id: prod.id,
      product_name_snapshot: prod.name,
      product_price_snapshot: prod.unit_price,
      quantity: itemPlan.quantity,
    };
    currentOrderItems.push(item);
    allOrderItems.push(item);

    orderTotalQty += item.quantity;
    orderTotalAmount += item.quantity * prod.unit_price;

    // Stock movement handling
    if (plan.status === 'Confirmed') {
      stockMovements.push({
        id: movementIdSeq++,
        product_id: prod.id,
        product_name: prod.name,
        sku: prod.sku,
        quantity_changed: item.quantity,
        movement_type: 'OUT',
        reason: `Order ${plan.order_number} confirmed`,
        created_by: plan.created_by,
        created_by_name: plan.created_by === 2 ? 'Sales Representative' : 'Admin User',
        created_at: plan.created_at,
      });
    } else if (plan.status === 'Cancelled') {
      // Deducted upon initial confirmation, then restored upon cancellation
      stockMovements.push({
        id: movementIdSeq++,
        product_id: prod.id,
        product_name: prod.name,
        sku: prod.sku,
        quantity_changed: item.quantity,
        movement_type: 'OUT',
        reason: `Order ${plan.order_number} confirmed`,
        created_by: plan.created_by,
        created_by_name: plan.created_by === 2 ? 'Sales Representative' : 'Admin User',
        created_at: plan.created_at,
      });

      stockMovements.push({
        id: movementIdSeq++,
        product_id: prod.id,
        product_name: prod.name,
        sku: prod.sku,
        quantity_changed: item.quantity,
        movement_type: 'IN',
        reason: `Order ${plan.order_number} cancelled - stock restored`,
        created_by: 3, // Warehouse Officer
        created_by_name: 'Warehouse Officer',
        created_at: plan.cancel_at || plan.created_at,
      });
    }
  }

  orders.push({
    id: orderId,
    order_number: plan.order_number,
    customer_id: plan.customer_id,
    customer_name: cust.name,
    business_name: cust.business_name,
    status: plan.status,
    total_quantity: orderTotalQty,
    total_amount: Math.round(orderTotalAmount * 100) / 100,
    created_by: plan.created_by,
    created_by_name: plan.created_by === 2 ? 'Sales Representative' : 'Admin User',
    created_at: plan.created_at,
    items: currentOrderItems,
  });
}

// Calculate current stock for each product strictly from stock movements:
// current_stock = Σ(IN) - Σ(OUT)
const stockMap = new Map<number, { inQty: number; outQty: number }>();
for (const m of stockMovements) {
  const current = stockMap.get(m.product_id) || { inQty: 0, outQty: 0 };
  if (m.movement_type === 'IN') {
    current.inQty += m.quantity_changed;
  } else {
    current.outQty += m.quantity_changed;
  }
  stockMap.set(m.product_id, current);
}

// Target specific products to be Low Stock or Zero Stock for realistic warehouse KPI demos
// Let's designate:
// Product 2: Schneider 63A RCCB -> Low Stock
// Product 8: Crompton 150W Flood Light -> Low Stock
// Product 16: Automatic Phase Changer -> Low Stock
// Product 25: MS Threaded Rod M16 -> Low Stock
// Product 36: Allen Cooper Safety Shoes -> Low Stock
// Product 44: Honeywell Face Shield -> Low Stock
// Product 51: DeWalt Cordless Impact Drill -> Low Stock
// Product 59: Industrial Air Compressor Pump -> Low Stock
// Product 68: Heavy Duty Hydraulic Pallet Truck -> Low Stock
// Product 74: Hydraulic Scissor Lift -> Low Stock
// Product 78: Heavy Drum Lifter -> Low Stock
// Product 4: Polycab 4 Sq mm Armoured Cable -> Zero Stock
// Product 58: ESAB 200A Welding Machine -> Zero Stock
// Product 68 (MHS-004): Electric Chain Hoist -> Zero Stock

for (const p of products) {
  const s = stockMap.get(p.id) || { inQty: 0, outQty: 0 };
  let net = s.inQty - s.outQty;

  // If net is negative (should not happen with our conservative quantities, but let's balance):
  if (net < 0) {
    const deficit = Math.abs(net) + 15;
    // Add an extra inbound movement
    stockMovements.push({
      id: movementIdSeq++,
      product_id: p.id,
      product_name: p.name,
      sku: p.sku,
      quantity_changed: deficit,
      movement_type: 'IN',
      reason: `Automated replenishment PO-2026-0925`,
      created_by: 3,
      created_by_name: 'Warehouse Officer',
      created_at: '2026-09-25T11:00:00.000Z',
    });
    s.inQty += deficit;
    net += deficit;
  }

  p.current_stock = net;
}

// Now let's tune target low stock items so they have 2..min_stock_alert units
const targetLowStockIds = [2, 8, 16, 22, 35, 41, 51, 59, 68, 74, 78];
const targetZeroStockIds = [4, 56, 68]; // note: 4 is Polycab, 56 is ESAB Arc Welding

for (const id of targetLowStockIds) {
  const p = products.find(prod => prod.id === id);
  if (!p) continue;
  const s = stockMap.get(id)!;
  const currentNet = s.inQty - s.outQty;
  const targetStock = Math.max(2, Math.floor(p.min_stock_alert * 0.45)); // e.g. 4 units
  const diff = targetStock - currentNet;
  if (diff !== 0) {
    if (diff > 0) {
      stockMovements.push({
        id: movementIdSeq++,
        product_id: p.id,
        product_name: p.name,
        sku: p.sku,
        quantity_changed: diff,
        movement_type: 'IN',
        reason: `Inventory reconciliation audit adjustment`,
        created_by: 3,
        created_by_name: 'Warehouse Officer',
        created_at: '2026-06-15T09:00:00.000Z',
      });
      s.inQty += diff;
    } else {
      // diff < 0: we need to consume more or reduce inbound
      stockMovements.push({
        id: movementIdSeq++,
        product_id: p.id,
        product_name: p.name,
        sku: p.sku,
        quantity_changed: Math.abs(diff),
        movement_type: 'OUT',
        reason: `Warehouse internal scrap / damaged goods write-off`,
        created_by: 3,
        created_by_name: 'Warehouse Officer',
        created_at: '2026-06-20T14:30:00.000Z',
      });
      s.outQty += Math.abs(diff);
    }
    p.current_stock = s.inQty - s.outQty;
  }
}

for (const id of targetZeroStockIds) {
  const p = products.find(prod => prod.id === id);
  if (!p) continue;
  const s = stockMap.get(id)!;
  const currentNet = s.inQty - s.outQty;
  if (currentNet > 0) {
    stockMovements.push({
      id: movementIdSeq++,
      product_id: p.id,
      product_name: p.name,
      sku: p.sku,
      quantity_changed: currentNet,
      movement_type: 'OUT',
      reason: `Stock reserve allocation for major industrial turnkey contract`,
      created_by: 3,
      created_by_name: 'Warehouse Officer',
      created_at: '2026-08-10T16:00:00.000Z',
    });
    s.outQty += currentNet;
    p.current_stock = 0;
  }
}

// Final Verification check of the mathematical balance
console.log('--- MATHEMATICAL STOCK VERIFICATION ---');
let balanced = true;
let lowStockCount = 0;
let zeroStockCount = 0;

for (const p of products) {
  const inSum = stockMovements.filter(m => m.product_id === p.id && m.movement_type === 'IN').reduce((acc, m) => acc + m.quantity_changed, 0);
  const outSum = stockMovements.filter(m => m.product_id === p.id && m.movement_type === 'OUT').reduce((acc, m) => acc + m.quantity_changed, 0);
  const expectedStock = inSum - outSum;

  if (p.current_stock !== expectedStock) {
    console.error(`Mismatch for product ${p.id} (${p.name}): stored ${p.current_stock} != expected ${expectedStock}`);
    balanced = false;
  }
  if (p.current_stock <= 0) {
    zeroStockCount++;
  } else if (p.current_stock <= p.min_stock_alert) {
    lowStockCount++;
  }
}

console.log(`Stock Reconciliation status: ${balanced ? 'PERFECT' : 'FAILED'}`);
console.log(`Products: ${products.length} total, ${lowStockCount} low stock alerts, ${zeroStockCount} out of stock.`);
console.log(`Customers: ${customers.length}`);
console.log(`Orders: ${orders.length} (Confirmed: ${orders.filter(o => o.status === 'Confirmed').length}, Draft: ${orders.filter(o => o.status === 'Draft').length}, Cancelled: ${orders.filter(o => o.status === 'Cancelled').length})`);
console.log(`Order Items: ${allOrderItems.length}`);
console.log(`Stock Movements: ${stockMovements.length}`);

// Sort stock movements chronologically descending (newest first for UI table)
stockMovements.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

// Sort orders chronologically descending (newest first for UI table)
orders.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

// Write frontend/src/api/demoData.ts
const frontendDemoDataTs = `// AUTOGENERATED ENTERPRISE DEMO DATASET
// Mathematical reconciliation: current_stock = Σ(IN) - Σ(OUT)
// 65 Customers, 80 Products, 150 Orders, 380+ Order Items, 220+ Stock Movements

export interface DemoCustomer {
  id: number;
  name: string;
  mobile: string;
  email: string;
  business_name: string;
  gst_no: string | null;
  type: 'Retail' | 'Wholesale' | 'Distributor';
  address: string;
  status: 'Lead' | 'Active' | 'Inactive';
  follow_up_date: string | null;
  notes: string;
  created_at: string;
}

export interface DemoProduct {
  id: number;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  min_stock_alert: number;
  location: string;
  created_at: string;
}

export interface DemoOrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name_snapshot: string;
  product_price_snapshot: number;
  quantity: number;
}

export interface DemoOrder {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name: string;
  business_name: string;
  status: 'Draft' | 'Confirmed' | 'Cancelled';
  total_quantity: number;
  total_amount: number;
  created_by?: number;
  created_by_name: string;
  created_at: string;
  items: DemoOrderItem[];
}

export interface DemoStockMovement {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  quantity_changed: number;
  movement_type: 'IN' | 'OUT';
  reason: string;
  created_by?: number;
  created_by_name: string;
  created_at: string;
}

export const demoCustomers: DemoCustomer[] = ${JSON.stringify(customers, null, 2)};

export const demoProducts: DemoProduct[] = ${JSON.stringify(products, null, 2)};

export const demoOrders: DemoOrder[] = ${JSON.stringify(orders, null, 2)};

export const demoStockMovements: DemoStockMovement[] = ${JSON.stringify(stockMovements, null, 2)};
`;

const frontendPath = path.resolve(__dirname, '../../../frontend/src/api/demoData.ts');
fs.writeFileSync(frontendPath, frontendDemoDataTs, 'utf8');
console.log('✅ Wrote frontend/src/api/demoData.ts to ' + frontendPath);

// Write backend/src/config/seedData.ts
const backendSeedDataTs = `// AUTOGENERATED ENTERPRISE DEMO SEED DATA
// Preserves PostgreSQL schema integrity and mathematical stock balance

export interface SeedCustomer {
  id: number;
  name: string;
  mobile: string;
  email: string;
  business_name: string;
  gst_no: string | null;
  type: 'Retail' | 'Wholesale' | 'Distributor';
  address: string;
  status: 'Lead' | 'Active' | 'Inactive';
  follow_up_date: string | null;
  notes: string;
  created_at: string;
}

export interface SeedProduct {
  id: number;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  min_stock_alert: number;
  location: string;
  created_at: string;
}

export interface SeedOrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name_snapshot: string;
  product_price_snapshot: number;
  quantity: number;
}

export interface SeedOrder {
  id: number;
  order_number: string;
  customer_id: number;
  status: 'Draft' | 'Confirmed' | 'Cancelled';
  total_quantity: number;
  created_by: number;
  created_at: string;
}

export interface SeedStockMovement {
  id: number;
  product_id: number;
  quantity_changed: number;
  movement_type: 'IN' | 'OUT';
  reason: string;
  created_by: number;
  created_at: string;
}

export const seedCustomers: SeedCustomer[] = ${JSON.stringify(customers, null, 2)};

export const seedProducts: SeedProduct[] = ${JSON.stringify(products, null, 2)};

// Strip virtual client fields for backend PostgreSQL insertion
export const seedOrders: SeedOrder[] = ${JSON.stringify(
  orders.map(o => ({
    id: o.id,
    order_number: o.order_number,
    customer_id: o.customer_id,
    status: o.status,
    total_quantity: o.total_quantity,
    created_by: o.created_by,
    created_at: o.created_at,
  })),
  null,
  2
)};

export const seedOrderItems: SeedOrderItem[] = ${JSON.stringify(allOrderItems, null, 2)};

export const seedStockMovements: SeedStockMovement[] = ${JSON.stringify(
  stockMovements.map(m => ({
    id: m.id,
    product_id: m.product_id,
    quantity_changed: m.quantity_changed,
    movement_type: m.movement_type,
    reason: m.reason,
    created_by: m.created_by,
    created_at: m.created_at,
  })),
  null,
  2
)};
`;

const backendPath = path.resolve(__dirname, '../config/seedData.ts');
fs.writeFileSync(backendPath, backendSeedDataTs, 'utf8');
console.log('✅ Wrote backend/src/config/seedData.ts to ' + backendPath);
