export const CUSTOMERS = [
  {
    id: "activation", score: 94, cat: "Activation",
    name: "Aarav Mehta", card: "Platinum Credit", segment: "Affluent", since: "Aug 2026",
    signalTitle: "Card delivered 7 days ago, still not activated",
    signalDetail: "Delivered and signed for on 28 Aug. No activation, no transaction, one automated SMS sent on day 2 with no open.",
    chips: ["DELIVERED 28 AUG", "0 TXN", "DAY 7"],
    action: "Send activation nudge", cta: "Nudge customer",
    value: "₹32,400", valueNote: "Modelled first-year interchange + fees",
    context: [
      { k: "Journey stage", v: "Delivered" }, { k: "Days inactive", v: "7" },
      { k: "Prior contact", v: "1 SMS, day 2" }, { k: "App installed", v: "Yes, logged in" },
      { k: "Channel preference", v: "App push" }, { k: "Salary account", v: "Yes" }
    ],
    sources: ["Card issuance", "Delivery tracking", "Activation status", "Transactions", "Comms history", "App telemetry"],
    steps: [
      { label: "Checked card delivery status", result: "Delivered 28 Aug" },
      { label: "Checked activation status", result: "Not activated" },
      { label: "Verified no transaction has occurred", result: "0 txns" },
      { label: "Measured inactivity window", result: "7 days" },
      { label: "Reviewed previous communications", result: "1 SMS, unopened" },
      { label: "Selected activation journey", result: "In-app 1-tap" },
      { label: "Generated personalised message", result: "Draft ready" },
      { label: "Selected communication channel", result: "Push + SMS" }
    ],
    channel: "App push + SMS", timing: "Today, 7:10 pm", likelihood: "68%",
    rationale: "Evening push outperforms morning SMS for this segment by 2.4×. Day-7 is the last window before activation rates fall sharply.",
    notifTitle: "Your Platinum card is ready to use",
    notifBody: "Activate it in the app in under a minute — no branch visit, no call.",
    appKicker: "ACTIVATE YOUR CARD", appTitle: "One tap and your card is live",
    appBody: "Aarav, your card ending 4417 was delivered last week. Activating takes about 30 seconds.",
    appPoints: ["Set your PIN in the app", "Add to your phone wallet instantly", "₹1,500 welcome bonus on first spend"],
    appCta: "Activate card",
    outcomeTitle: "Card activated", outcomeBody: "PIN set and card added to wallet. Welcome bonus unlocked.",
    outcomeLog: [{ t: "19:10", label: "Push delivered" }, { t: "19:14", label: "Notification opened" }, { t: "19:16", label: "Card activated and added to wallet" }, { t: "21:40", label: "First transaction — ₹2,340, groceries" }]
  },
  {
    id: "autopay", score: 81, cat: "Engagement",
    name: "Rohan Iyer", card: "Signature Credit", segment: "Mass affluent", since: "Mar 2023",
    signalTitle: "Six consecutive manual bill payments, AutoPay not enabled",
    signalDetail: "Pays in full every cycle but always manually, twice within 48 hours of the due date. One late payment in Jan 2026.",
    chips: ["6 MANUAL CYCLES", "AUTOPAY OFF", "2 NEAR-MISSES"],
    action: "Recommend AutoPay setup", cta: "Recommend AutoPay",
    value: "₹4,100", valueNote: "Avoided late fees and retained balance",
    context: [
      { k: "Journey stage", v: "Active, mature" }, { k: "Avg monthly bill", v: "₹48,600" },
      { k: "Payment mode", v: "Manual UPI" }, { k: "Late payments", v: "1 in 12 months" },
      { k: "Primary account", v: "Savings ····8802" }, { k: "Channel preference", v: "App push" }
    ],
    sources: ["Billing history", "Repayment ledger", "Standing instructions", "Linked accounts", "Eligibility rules"],
    steps: [
      { label: "Checked billing and repayment history", result: "12 cycles" },
      { label: "Detected repeated manual payments", result: "6 in a row" },
      { label: "Confirmed AutoPay is not enabled", result: "No mandate" },
      { label: "Identified preferred payment account", result: "····8802" },
      { label: "Checked AutoPay eligibility", result: "Eligible" },
      { label: "Generated contextual recommendation", result: "Draft ready" }
    ],
    channel: "App push", timing: "3 days before statement", likelihood: "54%",
    rationale: "Timed just before the statement date, when the payment task is already on the customer's mind. Framed around control, not automation.",
    notifTitle: "Never miss a card payment again",
    notifBody: "Set up AutoPay from your ····8802 account in a few taps. Cancel any time.",
    appKicker: "AUTOPAY", appTitle: "Pay on time, without thinking about it",
    appBody: "You have paid your last six bills manually. AutoPay settles the full amount from your savings account on the due date.",
    appPoints: ["Full amount or minimum due — your choice", "Alert 2 days before every debit", "Turn it off any time"],
    appCta: "Set up AutoPay",
    outcomeTitle: "AutoPay enabled", outcomeBody: "Full statement amount will be debited from ····8802 on each due date.",
    outcomeLog: [{ t: "10:02", label: "Push delivered" }, { t: "10:09", label: "AutoPay screen opened" }, { t: "10:11", label: "Mandate created — full amount" }]
  },
  {
    id: "upgrade", score: 91, cat: "Cross-sell",
    name: "Kavya Nair", card: "Signature Credit", segment: "HNI", since: "Jun 2021",
    signalTitle: "₹14.2L annual spend against a ₹6L limit, 82% utilisation",
    signalDetail: "Spend is concentrated in travel (34%) and dining (22%). Currently earns 2× points; a premium product would earn 5× on both categories.",
    chips: ["₹14.2L / YEAR", "82% UTILISATION", "TRAVEL + DINING"],
    action: "Offer premium upgrade", cta: "Offer upgrade",
    value: "₹1,86,000", valueNote: "Incremental annual revenue over 3 years",
    context: [
      { k: "Annual spend", v: "₹14.2L" }, { k: "Top category", v: "Travel, 34%" },
      { k: "Limit utilisation", v: "82%" }, { k: "Current tier", v: "Signature" },
      { k: "Lounge visits", v: "11 (cap 8)" }, { k: "Eligibility", v: "Pre-approved" }
    ],
    sources: ["Annual spend", "Category mix", "Product catalogue", "Benefit usage", "Rewards ledger", "Credit policy"],
    steps: [
      { label: "Analysed total annual spend", result: "₹14.2L" },
      { label: "Analysed spend by category", result: "6 categories" },
      { label: "Identified travel and dining behaviour", result: "56% of spend" },
      { label: "Checked current product and benefits", result: "Signature" },
      { label: "Compared against premium products", result: "3 candidates" },
      { label: "Calculated incremental rewards", result: "+₹61k / yr" },
      { label: "Checked upgrade eligibility", result: "Pre-approved" },
      { label: "Generated upgrade proposition", result: "Draft ready" }
    ],
    channel: "RM call + in-app offer", timing: "Thu 11:00 am", likelihood: "47%",
    rationale: "Lounge visits already exceed the Signature cap, which makes the upgrade a solved problem rather than a sales pitch. Lead with the number she loses today.",
    notifTitle: "Kavya, your card is costing you ₹61,000 a year",
    notifBody: "Based on your travel and dining, the Reserve card would return more than you spend on it.",
    appKicker: "PRE-APPROVED UPGRADE", appTitle: "Reserve card, based on how you actually spend",
    appBody: "You spent ₹14.2L last year, 56% of it on travel and dining, and used 11 lounge visits against a cap of 8.",
    appPoints: ["5× points on travel and dining — worth ₹61,000 more a year", "Unlimited domestic and 12 international lounge visits", "Limit raised to ₹12L on approval"],
    appCta: "Review upgrade",
    outcomeTitle: "Upgrade accepted", outcomeBody: "Reserve card approved. Physical card dispatched, virtual card live now.",
    outcomeLog: [{ t: "11:04", label: "RM call connected — 6 min" }, { t: "11:12", label: "In-app offer opened" }, { t: "11:18", label: "Upgrade accepted, limit raised to ₹12L" }]
  },
  {
    id: "travel", score: 88, cat: "Cross-sell",
    name: "Ishaan Gupta", card: "Platinum Credit", segment: "Affluent", since: "Nov 2024",
    signalTitle: "Three flight bookings in ten days for travel starting 19 Sep",
    signalDetail: "Two international sectors and one domestic. Forex markup applies on his current card; he has never used his four complimentary lounge visits.",
    chips: ["3 BOOKINGS", "DEPARTS 19 SEP", "0 LOUNGE USED"],
    action: "Surface travel benefits", cta: "Send travel pack",
    value: "₹27,500", valueNote: "Forex spend retained on card",
    context: [
      { k: "Journey stage", v: "Active" }, { k: "Trip starts", v: "19 Sep, 15 days" },
      { k: "Sectors", v: "BLR–SIN, SIN–BLR, BLR–DEL" }, { k: "Lounge visits used", v: "0 of 4" },
      { k: "Forex card held", v: "No" }, { k: "Last year abroad", v: "₹2.1L spent" }
    ],
    sources: ["Merchant transactions", "Travel bookings", "Benefit usage", "Forex history", "Offer catalogue"],
    steps: [
      { label: "Detected airline merchant transactions", result: "3 bookings" },
      { label: "Inferred travel window", result: "19–26 Sep" },
      { label: "Checked last year's overseas spend", result: "₹2.1L" },
      { label: "Checked unused travel benefits", result: "4 lounge visits" },
      { label: "Compared forex markup vs alternatives", result: "3.5% → 0%" },
      { label: "Selected relevant offers", result: "Lounge + forex" },
      { label: "Generated pre-trip message", result: "Draft ready" }
    ],
    channel: "App push + email", timing: "5 days before departure", likelihood: "61%",
    rationale: "Sent close enough to departure to be useful, early enough to order a forex card. Only benefits relevant to this trip are shown.",
    notifTitle: "Before you fly on 19 September",
    notifBody: "Four lounge visits you have not used, and a way to avoid the 3.5% forex markup in Singapore.",
    appKicker: "YOUR TRIP · 19–26 SEP", appTitle: "Two things to set up before Singapore",
    appBody: "Your card already covers more of this trip than you are using.",
    appPoints: ["4 complimentary lounge visits at BLR — unused this year", "Zero forex markup with a linked multi-currency card", "Trip insurance activates automatically when you pay with this card"],
    appCta: "Set up for my trip",
    outcomeTitle: "Travel pack activated", outcomeBody: "Forex card ordered and lounge access linked to the 19 Sep booking.",
    outcomeLog: [{ t: "18:30", label: "Push delivered" }, { t: "18:37", label: "Travel pack opened" }, { t: "18:44", label: "Forex card ordered, lounge access linked" }]
  },
  {
    id: "firstspend", score: 79, cat: "Activation",
    name: "Diya Sharma", card: "Platinum Credit", segment: "Emerging affluent", since: "Aug 2026",
    signalTitle: "Activated 12 days ago, no first transaction yet",
    signalDetail: "Card activated and added to wallet, but never used. Welcome benefit expires in 18 days.",
    chips: ["ACTIVATED", "0 TXN", "OFFER EXPIRES 22 SEP"],
    action: "Send first-spend offer", cta: "Send offer",
    value: "₹21,800", valueNote: "Modelled first-year spend",
    context: [
      { k: "Journey stage", v: "Activated" }, { k: "Days since activation", v: "12" },
      { k: "Welcome offer", v: "Unclaimed" }, { k: "Wallet added", v: "Yes" },
      { k: "Top merchant (debit)", v: "Grocery, weekly" }, { k: "Channel preference", v: "App push" }
    ],
    sources: ["Activation record", "Transactions", "Offer catalogue", "Debit card behaviour", "Profile"],
    steps: [
      { label: "Checked activation date", result: "23 Aug" },
      { label: "Checked transaction history", result: "0 txns" },
      { label: "Identified absence of first spend", result: "Confirmed" },
      { label: "Checked eligible welcome offers", result: "2 eligible" },
      { label: "Evaluated profile and preferences", result: "Grocery-led" },
      { label: "Selected the most relevant offer", result: "Grocery 10%" },
      { label: "Generated personalised nudge", result: "Draft ready" }
    ],
    channel: "App push", timing: "Saturday 10:00 am", likelihood: "58%",
    rationale: "Timed to her weekly grocery run, the spend she already makes on debit. Lower friction than asking for a new behaviour.",
    notifTitle: "Your welcome benefit expires in 18 days",
    notifBody: "Use your card on your next grocery shop and get 10% back, up to ₹1,500.",
    appKicker: "WELCOME OFFER", appTitle: "10% back on your first shop",
    appBody: "Diya, your card has been ready since 23 August. Your welcome benefit is still waiting.",
    appPoints: ["10% back, up to ₹1,500", "Valid at all major grocery merchants", "Expires 22 September"],
    appCta: "Claim offer",
    outcomeTitle: "First transaction made", outcomeBody: "₹3,120 at a grocery merchant. ₹312 cashback credited.",
    outcomeLog: [{ t: "10:00", label: "Push delivered" }, { t: "11:22", label: "Offer claimed" }, { t: "12:48", label: "First transaction — ₹3,120" }]
  },
  {
    id: "churn", score: 86, cat: "Engagement",
    name: "Meera Rao", card: "Signature Credit", segment: "HNI", since: "Feb 2019",
    signalTitle: "Spend down 61% over three months against her own baseline",
    signalDetail: "Monthly spend fell from ₹1.9L to ₹74k. A competitor co-brand card appeared in her credit bureau file in July.",
    chips: ["−61% IN 3 MTHS", "NEW COMPETITOR CARD", "RENEWS JAN"],
    action: "Trigger retention outreach", cta: "Open retention play",
    value: "₹2,40,000", valueNote: "Annual spend at risk",
    context: [
      { k: "Baseline spend", v: "₹1.9L / month" }, { k: "Current spend", v: "₹74k / month" },
      { k: "Trend started", v: "June 2026" }, { k: "Bureau signal", v: "New card, July" },
      { k: "Renewal date", v: "12 Jan 2027" }, { k: "Complaints", v: "None" }
    ],
    sources: ["Spend trend", "Category mix", "Bureau data", "Service history", "Renewal calendar"],
    steps: [
      { label: "Compared spend to personal baseline", result: "−61%" },
      { label: "Isolated categories that dropped", result: "Fuel, dining" },
      { label: "Ruled out seasonality", result: "Not seasonal" },
      { label: "Checked service and complaint history", result: "Clean" },
      { label: "Checked bureau for new credit lines", result: "1 new card" },
      { label: "Selected retention play", result: "Fee waiver + fuel" },
      { label: "Generated RM talking points", result: "Draft ready" }
    ],
    channel: "RM call, then app offer", timing: "Within 48 hours", likelihood: "43%",
    rationale: "A competitor card, not dissatisfaction. Lead with the categories she moved away, and waive the renewal fee before it becomes the reason to leave.",
    notifTitle: "A few things we can improve on your card",
    notifBody: "Your RM has set aside a fuel and dining benefit and waived your next renewal fee.",
    appKicker: "FOR YOU", appTitle: "We would like to keep you",
    appBody: "Meera, your RM has applied three changes to your account, effective today.",
    appPoints: ["Renewal fee waived for 2027", "5% back on fuel, capped at ₹1,000 a month", "Dining programme enrolment at no cost"],
    appCta: "See what changed",
    outcomeTitle: "Retention offer accepted", outcomeBody: "Fee waived and benefits applied. Spend recovered to ₹1.4L the following month.",
    outcomeLog: [{ t: "14:20", label: "RM call connected — 9 min" }, { t: "14:35", label: "Benefits applied to account" }, { t: "Sep 30", label: "Monthly spend recovered to ₹1.4L" }]
  },
  {
    id: "rewards", score: 74, cat: "Engagement",
    name: "Vikram Shetty", card: "Platinum Credit", segment: "Mass affluent", since: "Sep 2022",
    signalTitle: "48,200 points unredeemed, 9,400 expire on 31 October",
    signalDetail: "Has never redeemed. Points are worth ₹12,050 at the best available rate, ₹4,800 at the worst.",
    chips: ["48,200 PTS", "9,400 EXPIRING", "0 REDEMPTIONS"],
    action: "Recommend redemption", cta: "Suggest redemption",
    value: "₹12,050", valueNote: "Value of points at best redemption rate",
    context: [
      { k: "Points balance", v: "48,200" }, { k: "Expiring 31 Oct", v: "9,400" },
      { k: "Redemptions to date", v: "0" }, { k: "Best rate", v: "₹0.25 / point" },
      { k: "Top category", v: "E-commerce" }, { k: "Channel preference", v: "Email" }
    ],
    sources: ["Rewards ledger", "Expiry schedule", "Redemption catalogue", "Category mix"],
    steps: [
      { label: "Read rewards balance and expiry", result: "48,200 pts" },
      { label: "Flagged points expiring this quarter", result: "9,400" },
      { label: "Checked redemption history", result: "None" },
      { label: "Ranked catalogue by value per point", result: "₹0.25 top" },
      { label: "Matched options to spend behaviour", result: "E-commerce" },
      { label: "Generated redemption prompt", result: "Draft ready" }
    ],
    channel: "Email + app card", timing: "Sat 9:00 am", likelihood: "52%",
    rationale: "The expiry date does the work. Only the three highest-value redemptions are shown, ranked in rupees rather than points.",
    notifTitle: "9,400 of your points expire on 31 October",
    notifBody: "Your full balance is worth ₹12,050. Here are the three best ways to use it.",
    appKicker: "REWARDS", appTitle: "₹12,050 sitting in your account",
    appBody: "You have 48,200 points and have never redeemed them. These options give you the most per point.",
    appPoints: ["₹12,050 as e-commerce vouchers — best rate", "₹9,600 off your next statement", "24,000 airline miles"],
    appCta: "Redeem points",
    outcomeTitle: "Points redeemed", outcomeBody: "48,200 points converted to ₹12,050 in e-commerce vouchers.",
    outcomeLog: [{ t: "09:00", label: "Email opened" }, { t: "09:26", label: "Redemption catalogue browsed" }, { t: "09:31", label: "48,200 points redeemed" }]
  },
  {
    id: "dining", score: 69, cat: "Cross-sell",
    name: "Ananya Bose", card: "Platinum Credit", segment: "Emerging affluent", since: "Jan 2025",
    signalTitle: "38% of spend is dining, no dining programme enrolled",
    signalDetail: "₹1.4L a year at restaurants, mostly at partner merchants where she is paying full price.",
    chips: ["38% DINING", "₹1.4L / YEAR", "NOT ENROLLED"],
    action: "Recommend dining benefit", cta: "Send dining offer",
    value: "₹18,700", valueNote: "Retained dining spend and programme fee",
    context: [
      { k: "Dining share", v: "38% of spend" }, { k: "Annual dining", v: "₹1.4L" },
      { k: "Partner merchants", v: "62% of dining" }, { k: "Programme", v: "Not enrolled" },
      { k: "Avg ticket", v: "₹2,850" }, { k: "Channel preference", v: "App push" }
    ],
    sources: ["Merchant categories", "Partner network", "Programme enrolment", "Offer catalogue"],
    steps: [
      { label: "Analysed spend by merchant category", result: "Dining 38%" },
      { label: "Matched merchants to partner network", result: "62% partner" },
      { label: "Checked dining programme enrolment", result: "Not enrolled" },
      { label: "Calculated forgone savings", result: "₹18,700 / yr" },
      { label: "Generated dining recommendation", result: "Draft ready" }
    ],
    channel: "App push", timing: "Friday 6:00 pm", likelihood: "49%",
    rationale: "Sent on a Friday evening, before the restaurant decision. The number shown is what she has already lost, not what she could save.",
    notifTitle: "You are paying full price at your regular restaurants",
    notifBody: "Six of the places you visit most are partners. Enrolment takes a minute.",
    appKicker: "DINING PROGRAMME", appTitle: "₹18,700 a year, at places you already go",
    appBody: "38% of your card spend is dining, and 62% of it is at partner restaurants.",
    appPoints: ["Up to 25% off at 1,400 partner restaurants", "2× points on all dining spend", "Free enrolment for the first year"],
    appCta: "Enrol now",
    outcomeTitle: "Enrolled in dining programme", outcomeBody: "Benefits active immediately at all partner restaurants.",
    outcomeLog: [{ t: "18:00", label: "Push delivered" }, { t: "18:11", label: "Programme page opened" }, { t: "18:13", label: "Enrolled" }]
  }
]

export function findCustomer(id) {
  return CUSTOMERS.find(c => c.id === id) || null
}

export const CATEGORIES = ["All", "Activation", "Engagement", "Cross-sell"]
