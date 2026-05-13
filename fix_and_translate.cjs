const fs = require('fs');
const path = require('path');

function replaceSafe(content, oldStr, newStr) {
  return content.split(oldStr).join(newStr);
}

function processFile(filePath, replacements) {
  const fullPath = path.join(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Inject useTranslation
  if (!content.includes('useTranslation')) {
    content = content.replace("import React", "import { useTranslation } from 'react-i18next';\nimport React");
    content = content.replace(/(export const \w+ = \([^)]*\) => {)/, "$1\n  const { t } = useTranslation();");
  }

  // First apply the structural fixes that were lost
  if (filePath === 'src/pages/artist/Dashboard.tsx') {
    content = replaceSafe(content, 
      "let myOrders = orders.filter(o => o.artist_id === user?.id && o.status === 'paid');",
      "let myOrders = orders.filter(o => o.artist_id === user?.id && o.status === 'paid' && o.appointments?.status === 'completed');"
    );
    content = replaceSafe(content, 
      "appt.status === 'completed' ? 'bg-green-100 text-green-800' :",
      "appt.status === 'completed' ? 'bg-zinc-100 text-zinc-800 dark:bg-hermes-teal/10 dark:text-hermes-teal' :"
    );
  }

  if (filePath === 'src/pages/artist/Schedule.tsx') {
    content = replaceSafe(content,
      "activeAppts.sort((a, b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime());",
      "activeAppts.sort((a, b) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime());"
    );
    content = replaceSafe(content,
      "appt.status === 'completed' ? 'bg-green-100 text-green-800' :",
      "appt.status === 'completed' ? 'bg-zinc-200 text-zinc-800 dark:bg-hermes-teal/10 dark:text-hermes-teal' :"
    );
    content = replaceSafe(content,
      "<option value=\"paid\">Paid</option>",
      ""
    );
    content = replaceSafe(content,
      "appt.status === 'paid' ? 'bg-purple-100 text-purple-800' :",
      ""
    );
  }

  if (filePath === 'src/pages/artist/Accommodations.tsx') {
    content = replaceSafe(content,
      "bg-blue-50 flex items-start gap-4",
      "bg-blue-50 dark:bg-hermes-teal/10 flex items-start gap-4"
    );
    content = replaceSafe(content,
      "bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600",
      "bg-blue-100 dark:bg-hermes-teal/20 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-hermes-teal"
    );
    content = replaceSafe(content,
      "text-sm font-medium text-blue-600 mt-1",
      "text-sm font-medium text-blue-600 dark:text-hermes-teal mt-1"
    );
  }

  if (filePath === 'src/pages/artist/Conventions.tsx') {
    content = replaceSafe(content,
      "bg-zinc-100 text-zinc-600 py-2 rounded-none",
      "bg-zinc-100 dark:bg-hermes-teal/10 text-zinc-600 dark:text-hermes-teal py-2 rounded-none"
    );
    content = replaceSafe(content,
      "CheckCircle className=\"w-4 h-4 text-green-600\"",
      "CheckCircle className=\"w-4 h-4 text-green-600 dark:text-hermes-teal\""
    );
    content = replaceSafe(content,
      "bg-white dark:bg-hermes-darkBg border border-zinc-300 hover:bg-zinc-50 transition-colors",
      "bg-white dark:bg-hermes-darkBg border border-zinc-300 hover:bg-zinc-50 dark:hover:bg-hermes-teal/10 transition-colors"
    );
    content = replaceSafe(content,
      "bg-zinc-100 text-zinc-600 text-xs font-medium px-2.5 py-0.5",
      "bg-zinc-100 dark:bg-hermes-teal/10 text-zinc-600 dark:text-hermes-teal text-xs font-medium px-2.5 py-0.5"
    );
  }

  if (filePath === 'src/pages/manager/Appointments.tsx') {
    content = replaceSafe(content,
      "<span className=\"text-xs font-medium text-hermes-blue dark:text-hermes-teal bg-red-50 px-2 py-1 rounded\">",
      "<span className=\"text-xs font-medium text-hermes-blue dark:text-hermes-teal bg-red-50 dark:bg-hermes-teal/10 px-2 py-1 rounded-none\">"
    );
    content = replaceSafe(content,
      "appt.status === 'completed' ? 'bg-green-100 text-green-800' :",
      "appt.status === 'completed' ? 'bg-zinc-100 text-zinc-800 dark:bg-hermes-teal/10 dark:text-hermes-teal' :"
    );
  }

  if (filePath === 'src/pages/manager/Dashboard.tsx') {
    content = replaceSafe(content,
      "const revenue = activeOrds.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);",
      "const revenue = activeOrds.filter(o => o.status === 'paid').reduce((sum, order) => sum + Number(order.total_amount || 0), 0);"
    );
  }

  // Modals scroll fix
  content = replaceSafe(content, "flex items-center justify-center z-50 p-4 sm:p-6", "flex items-start justify-center z-50 p-4 sm:p-6 overflow-y-auto");
  content = replaceSafe(content, "hermes-card shadow-xl w-full max-w-2xl\"", "hermes-card shadow-xl w-full max-w-2xl my-8 flex-shrink-0\"");

  // Apply translations safely
  for (const [oldStr, newStr] of Object.entries(replacements)) {
    content = replaceSafe(content, oldStr, newStr);
  }

  fs.writeFileSync(fullPath, content);
}

// Translations
processFile('src/pages/artist/Dashboard.tsx', {
  '>Welcome back, <': '>{t("common.welcome")}, <',
  '>Completed Orders (<': '>{t("dashboard.completedOrders")} (<',
  '>Earnings (<': '>{t("dashboard.earnings")} (<',
  '>Upcoming Conventions<': '>{t("dashboard.upcomingConventions")}<',
  '>View All<': '>{t("dashboard.viewAll")}<',
  '>No upcoming conventions.<': '>{t("dashboard.noUpcomingConvs")}<',
  '>Applied<': '>{t("dashboard.applied")}<',
  '>Apply Now<': '>{t("dashboard.applyNow")}<',
  '>My Recent Appointments<': '>{t("dashboard.myRecentAppts")}<',
  '>Schedule<': '>{t("dashboard.schedule")}<',
  '>You have no upcoming appointments.<': '>{t("dashboard.noUpcomingAppts")}<',
  ">Client<": ">{t('common.client')}<",
  "'Studio (No Convention)'": "t('common.studio')"
});

processFile('src/pages/manager/Dashboard.tsx', {
  '>Manager Dashboard<': '>{t("dashboard.managerTitle")}<',
  '>Upcoming Conventions<': '>{t("dashboard.upcomingConventions")}<',
  '>Active Appointments<': '>{t("dashboard.activeAppointments")}<',
  '>Pending Orders<': '>{t("dashboard.pendingOrders")}<',
  '>Total Revenue<': '>{t("dashboard.totalRevenue")}<',
  '>View All<': '>{t("dashboard.viewAll")}<',
  '>No upcoming conventions.<': '>{t("dashboard.noUpcomingConvs")}<',
  '>My Recent Appointments<': '>{t("dashboard.myRecentAppts")}<',
  '>Schedule<': '>{t("dashboard.schedule")}<',
  '>Orders<': '>{t("nav.orders")}<',
  '>You have no upcoming appointments.<': '>{t("dashboard.noUpcomingAppts")}<',
  ">Client<": ">{t('common.client')}<",
  "'Unknown'": "t('common.unknownClient')",
  "'Unassigned'": "t('common.unassigned')"
});

processFile('src/pages/artist/Schedule.tsx', {
  '>My Schedule<': '>{t("schedule.title")}<',
  '>You have no upcoming appointments.<': '>{t("schedule.noAppts")}<',
  "'Unknown Client'": "t('common.unknownClient')",
  "'Studio'": "t('common.studio')",
  '>Pending<': '>{t("common.pending")}<',
  '>Confirmed<': '>{t("common.confirmed")}<',
  '>In Progress<': '>{t("common.in_progress")}<',
  '>Completed<': '>{t("common.completed")}<',
  '>Paid<': '>{t("common.paid")}<',
  '>View Reference<': '>{t("schedule.viewRef")}<',
  "\\'s Tattoo Info<": "\\'s {t(\"schedule.tattooInfo\")}<",
  '>Description<': '>{t("schedule.description")}<',
  '>Reference Image<': '>{t("schedule.refImage")}<',
  '>Open Link<': '>{t("schedule.openLink")}<',
  '>No reference image or link provided.<': '>{t("schedule.noRef")}<',
  '>Contact Info<': '>{t("schedule.contactInfo")}<',
  '>Phone: <': '>{t("common.phone")}: <',
  '>Email: <': '>{t("common.email")}: <',
  '>Close<': '>{t("common.close")}<'
});

processFile('src/pages/manager/Orders.tsx', {
  '>Create New Order & Appointment<': '>{t("orders.create")}<',
  '>Edit Order & Appointment<': '>{t("orders.edit")}<',
  '>Customer Information<': '>{t("orders.customerInfo")}<',
  '>Name *<': '>{t("common.name")} *<',
  '>Phone<': '>{t("common.phone")}<',
  '>Email<': '>{t("common.email")}<',
  '>Tattoo Details<': '>{t("orders.tattooDetails")}<',
  '>Tattoo Type<': '>{t("orders.tattooType")}<',
  '>Custom Design<': '>{t("common.customDesign")}<',
  '>Flash<': '>{t("common.flash")}<',
  '>Cover Up<': '>{t("common.coverUp")}<',
  '>Reference Image / Link<': '>{t("schedule.refImage")}<',
  '>Description<': '>{t("schedule.description")}<',
  '>Assignment & Payment<': '>{t("orders.assignment")}<',
  '>Artist<': '>{t("orders.artist")}<',
  '>Unassigned<': '>{t("common.unassigned")}<',
  '>Appointment Time<': '>{t("orders.apptTime")}<',
  '>Total Amount ($) *<': '>{t("orders.totalAmount")} *<',
  '>Deposit Paid ($)<': '>{t("orders.depositAmount")}<',
  '>Cancel<': '>{t("common.cancel")}<',
  '>Create Order<': '>{t("common.create")}<',
  '>Update Order<': '>{t("common.update")}<',
  '>No orders found<': '>{t("orders.noOrders")}<',
  '>Pending<': '>{t("common.pending")}<',
  '>Deposit Paid<': '>{t("common.deposit_paid")}<',
  '>Paid<': '>{t("common.paid")}<',
  '>Cancelled<': '>{t("common.cancelled")}<'
});

processFile('src/pages/manager/Appointments.tsx', {
  '>Appointments<': '>{t("appointments.title")}<',
  "'Unknown Client'": "t('common.unknownClient')",
  '>No appointments found<': '>{t("appointments.noAppts")}<'
});

processFile('src/pages/manager/Conventions.tsx', {
  '>Conventions<': '>{t("conventions.title")}<',
  '>Create Convention<': '>{t("conventions.create")}<',
  '>Edit Convention<': '>{t("conventions.edit")}<',
  '>Convention Name<': '>{t("conventions.name")}<',
  '>Location<': '>{t("common.location")}<',
  '>Start Date<': '>{t("conventions.startDate")}<',
  '>End Date<': '>{t("conventions.endDate")}<',
  '>Artists Needed<': '>{t("conventions.artistsNeeded")}<',
  '>No conventions found.<': '>{t("conventions.noConvs")}<',
  '>Cancel<': '>{t("common.cancel")}<',
  '>Save<': '>{t("common.save")}<',
  '>Create<': '>{t("common.create")}<',
  '>Update<': '>{t("common.update")}<',
  '>Registration<': '>{t("conventions.registration")}<',
  '>Open<': '>{t("conventions.open")}<',
  '>Past Conventions Archive<': '>{t("conventions.pastArchive")}<'
});

processFile('src/pages/artist/Conventions.tsx', {
  '>Conventions<': '>{t("conventions.title")}<',
  '>Registration<': '>{t("conventions.registration")}<',
  '>Open<': '>{t("conventions.open")}<',
  '>Applied<': '>{t("dashboard.applied")}<',
  '>Apply for Booth<': '>{t("conventions.applyBooth")}<',
  '>Artists Needed<': '>{t("conventions.artistsNeeded")}<',
  '>Past Conventions Archive<': '>{t("conventions.pastArchive")}<',
  '>View My Orders & Earnings <': '>{t("conventions.viewOrdersEarnings")} <',
  '>No upcoming conventions found.<': '>{t("conventions.noConvs")}<'
});

processFile('src/pages/manager/ConventionDetails.tsx', {
  '>Artists Needed<': '>{t("conventions.artistsNeeded")}<',
  '>Total Revenue<': '>{t("dashboard.totalRevenue")}<',
  '>Earnings<': '>{t("dashboard.earnings")}<',
  '>Location<': '>{t("common.location")}<',
  '>Dates<': '>{t("common.dates")}<'
});

processFile('src/pages/artist/ConventionDetails.tsx', {
  '>Artists Needed<': '>{t("conventions.artistsNeeded")}<',
  '>Earnings<': '>{t("dashboard.earnings")}<',
  '>Location<': '>{t("common.location")}<',
  '>Dates<': '>{t("common.dates")}<'
});

processFile('src/pages/artist/Accommodations.tsx', {
  '>Accommodations<': '>{t("accommodations.title")}<',
  '>No accommodations found<': '>{t("accommodations.noAccs")}<'
});

processFile('src/pages/manager/Accommodations.tsx', {
  '>Accommodations<': '>{t("accommodations.title")}<',
  '>Create Accommodation<': '>{t("accommodations.create")}<',
  '>Hotel Name<': '>{t("accommodations.hotelName")}<',
  '>Check In<': '>{t("accommodations.checkIn")}<',
  '>Check Out<': '>{t("accommodations.checkOut")}<',
  '>Add Accommodation<': '>{t("accommodations.add")}<',
  '>No accommodations found<': '>{t("accommodations.noAccs")}<',
  '>Artist<': '>{t("accommodations.artist")}<',
  '>Convention<': '>{t("accommodations.convention")}<'
});

processFile('src/pages/manager/Finances.tsx', {
  '>Finances<': '>{t("finances.title")}<',
  '>Financial Overview<': '>{t("finances.overview")}<',
  '>Total Revenue<': '>{t("dashboard.totalRevenue")}<',
  '>Total Deposit<': '>{t("finances.totalDeposit")}<',
  '>Remaining Balance<': '>{t("finances.remainingBalance")}<',
  '>No paid orders found for this convention.<': '>{t("finances.noPaidOrders")}<',
  '>All<': '>{t("common.all")}<'
});

console.log("All fixes and translations applied safely!");
