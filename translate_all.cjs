const fs = require('fs');
const path = require('path');

function applyTranslation(filePath, replacements) {
  const file = path.join(__dirname, filePath);
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('useTranslation')) {
    content = content.replace("import React", "import { useTranslation } from 'react-i18next';\nimport React");
    
    // Add t hook after component definition
    const compRegex = /(export const \w+ = \([^)]*\) => {)/;
    content = content.replace(compRegex, "$1\n  const { t } = useTranslation();");
  }

  for (const [oldStr, newStr] of Object.entries(replacements)) {
    content = content.replace(new RegExp(oldStr, 'g'), newStr);
  }

  fs.writeFileSync(file, content);
  console.log(`Translated ${filePath}`);
}

applyTranslation('src/pages/artist/Dashboard.tsx', {
  'Welcome back, ': '{t("common.welcome")}, ',
  'Completed Orders': '{t("dashboard.completedOrders")}',
  'Earnings': '{t("dashboard.earnings")}',
  'Upcoming Conventions': '{t("dashboard.upcomingConventions")}',
  'View All': '{t("dashboard.viewAll")}',
  'No upcoming conventions.': '{t("dashboard.noUpcomingConvs")}',
  '>Applied<': '>{t("dashboard.applied")}<',
  '>Apply Now<': '>{t("dashboard.applyNow")}<',
  'My Recent Appointments': '{t("dashboard.myRecentAppts")}',
  '>Schedule<': '>{t("dashboard.schedule")}<',
  'You have no upcoming appointments.': '{t("dashboard.noUpcomingAppts")}',
  '>Client<': '>{t("common.client")}<',
  "Studio \\(No Convention\\)": "t('common.studio')"
});

applyTranslation('src/pages/manager/Dashboard.tsx', {
  'Manager Dashboard': '{t("dashboard.managerTitle")}',
  'Upcoming Conventions': '{t("dashboard.upcomingConventions")}',
  'Active Appointments': '{t("dashboard.activeAppointments")}',
  'Pending Orders': '{t("dashboard.pendingOrders")}',
  'Total Revenue': '{t("dashboard.totalRevenue")}',
  'View All': '{t("dashboard.viewAll")}',
  'No upcoming conventions.': '{t("dashboard.noUpcomingConvs")}',
  'My Recent Appointments': '{t("dashboard.myRecentAppts")}',
  '>Schedule<': '>{t("dashboard.schedule")}<',
  '>Orders<': '>{t("nav.orders")}<',
  'You have no upcoming appointments.': '{t("dashboard.noUpcomingAppts")}',
  '>Client<': '>{t("common.client")}<',
  "Unknown": "t('common.unknownClient')",
  "Unassigned": "t('common.unassigned')"
});

applyTranslation('src/pages/artist/Schedule.tsx', {
  'My Schedule': '{t("schedule.title")}',
  'You have no upcoming appointments.': '{t("schedule.noAppts")}',
  'Unknown Client': "t('common.unknownClient')",
  'Studio': "t('common.studio')",
  '>Pending<': '>{t("common.pending")}<',
  '>Confirmed<': '>{t("common.confirmed")}<',
  '>In Progress<': '>{t("common.in_progress")}<',
  '>Completed<': '>{t("common.completed")}<',
  '>Paid<': '>{t("common.paid")}<',
  'View Reference': '{t("schedule.viewRef")}',
  "'s Tattoo Info": "'s {t(\"schedule.tattooInfo\")}",
  'Description': '{t("schedule.description")}',
  'Reference Image': '{t("schedule.refImage")}',
  'Open Link': '{t("schedule.openLink")}',
  'No reference image or link provided.': '{t("schedule.noRef")}',
  'Contact Info': '{t("schedule.contactInfo")}',
  'Phone: ': '{t("common.phone")}: ',
  'Email: ': '{t("common.email")}: ',
  'Close': '{t("common.close")}'
});

applyTranslation('src/pages/manager/Orders.tsx', {
  'Create New Order & Appointment': '{t("orders.create")}',
  'Edit Order & Appointment': '{t("orders.edit")}',
  'Customer Information': '{t("orders.customerInfo")}',
  'Name \\*': '{t("common.name")} *',
  '>Phone<': '>{t("common.phone")}<',
  '>Email<': '>{t("common.email")}<',
  'Tattoo Details': '{t("orders.tattooDetails")}',
  'Tattoo Type': '{t("orders.tattooType")}',
  'Custom Design': '{t("common.customDesign")}',
  '>Flash<': '>{t("common.flash")}<',
  'Cover Up': '{t("common.coverUp")}',
  'Reference Image / Link': '{t("schedule.refImage")}',
  '>Description<': '>{t("schedule.description")}<',
  'Assignment & Payment': '{t("orders.assignment")}',
  '>Artist<': '>{t("orders.artist")}<',
  '>Unassigned<': '>{t("common.unassigned")}<',
  'Appointment Time': '{t("orders.apptTime")}',
  'Total Amount \\(\\\$\\)': '{t("orders.totalAmount")}',
  'Deposit Paid \\(\\\$\\)': '{t("orders.depositAmount")}',
  '>Cancel<': '>{t("common.cancel")}<',
  'Create Order': '{t("common.create")}',
  'Update Order': '{t("common.update")}',
  'No orders found': '{t("orders.noOrders")}',
  '>Pending<': '>{t("common.pending")}<',
  '>Deposit Paid<': '>{t("common.deposit_paid")}<',
  '>Paid<': '>{t("common.paid")}<',
  '>Cancelled<': '>{t("common.cancelled")}<'
});

applyTranslation('src/pages/manager/Appointments.tsx', {
  '>Appointments<': '>{t("appointments.title")}<',
  'Unknown Client': "t('common.unknownClient')",
  'No appointments found': '{t("appointments.noAppts")}'
});

applyTranslation('src/pages/manager/Conventions.tsx', {
  'Conventions': '{t("conventions.title")}',
  'Create Convention': '{t("conventions.create")}',
  'Edit Convention': '{t("conventions.edit")}',
  'Convention Name': '{t("conventions.name")}',
  'Location': '{t("common.location")}',
  'Start Date': '{t("conventions.startDate")}',
  'End Date': '{t("conventions.endDate")}',
  'Artists Needed': '{t("conventions.artistsNeeded")}',
  'No conventions found.': '{t("conventions.noConvs")}',
  '>Cancel<': '>{t("common.cancel")}<',
  '>Save<': '>{t("common.save")}<',
  '>Create<': '>{t("common.create")}<',
  '>Update<': '>{t("common.update")}<',
  'Registration': '{t("conventions.registration")}',
  '>Open<': '>{t("conventions.open")}<',
  'Past Conventions Archive': '{t("conventions.pastArchive")}'
});

applyTranslation('src/pages/artist/Conventions.tsx', {
  'Conventions': '{t("conventions.title")}',
  'Registration': '{t("conventions.registration")}',
  '>Open<': '>{t("conventions.open")}<',
  '>Applied<': '>{t("dashboard.applied")}<',
  'Apply for Booth': '{t("conventions.applyBooth")}',
  'Artists Needed': '{t("conventions.artistsNeeded")}',
  'Past Conventions Archive': '{t("conventions.pastArchive")}',
  'View My Orders & Earnings': '{t("conventions.viewOrdersEarnings")}',
  'No upcoming conventions found.': '{t("conventions.noConvs")}'
});

applyTranslation('src/pages/manager/ConventionDetails.tsx', {
  'Artists Needed': '{t("conventions.artistsNeeded")}',
  'Total Revenue': '{t("dashboard.totalRevenue")}',
  'Earnings': '{t("dashboard.earnings")}',
  'Location': '{t("common.location")}',
  'Dates': '{t("common.dates")}'
});

applyTranslation('src/pages/artist/ConventionDetails.tsx', {
  'Artists Needed': '{t("conventions.artistsNeeded")}',
  'Earnings': '{t("dashboard.earnings")}',
  'Location': '{t("common.location")}',
  'Dates': '{t("common.dates")}'
});

applyTranslation('src/pages/artist/Accommodations.tsx', {
  'Accommodations': '{t("accommodations.title")}',
  'No accommodations found': '{t("accommodations.noAccs")}'
});

applyTranslation('src/pages/manager/Accommodations.tsx', {
  'Accommodations': '{t("accommodations.title")}',
  'Create Accommodation': '{t("accommodations.create")}',
  'Hotel Name': '{t("accommodations.hotelName")}',
  'Check In': '{t("accommodations.checkIn")}',
  'Check Out': '{t("accommodations.checkOut")}',
  'Add Accommodation': '{t("accommodations.add")}',
  'No accommodations found': '{t("accommodations.noAccs")}',
  '>Artist<': '>{t("accommodations.artist")}<',
  '>Convention<': '>{t("accommodations.convention")}<'
});

applyTranslation('src/pages/manager/Finances.tsx', {
  'Finances': '{t("finances.title")}',
  'Financial Overview': '{t("finances.overview")}',
  'Total Revenue': '{t("dashboard.totalRevenue")}',
  'Total Deposit': '{t("finances.totalDeposit")}',
  'Remaining Balance': '{t("finances.remainingBalance")}',
  'No paid orders found for this convention.': '{t("finances.noPaidOrders")}',
  '>All<': '>{t("common.all")}<'
});

