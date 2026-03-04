export const chatbotResponses = {
  intents: [
    {
      intent: 'schedule_inquiry',
      patterns: [
        'show.*schedule',
        'my schedule',
        'when.*work',
        'what.*shifts',
        'upcoming shifts',
        'this week',
        'next week',
      ],
      responses: [
        'I can show you your schedule. You have 5 shifts scheduled this week: Monday through Friday, morning shifts (6:00 AM - 2:00 PM). Would you like more details?',
        'Looking at your schedule... You\'re assigned to morning shifts this week at the Main Office location. Your next shift is tomorrow at 6:00 AM.',
        'Here\'s your schedule overview: You have shifts on Mon, Tue, Wed, Thu, and Fri this week. All are morning shifts starting at 6:00 AM.',
      ],
      action: 'view_schedule',
      entities: ['this week', 'next week', 'today', 'tomorrow'],
    },
    {
      intent: 'leave_request',
      patterns: [
        'request leave',
        'take.*off',
        'vacation',
        'time off',
        'sick leave',
        'annual leave',
        'book leave',
      ],
      responses: [
        'I can help you request leave. What type of leave would you like to request? Options include: Annual Leave, Sick Leave, Personal Leave, or Unpaid Leave.',
        'To submit a leave request, I\'ll need: 1) Leave type, 2) Start date, 3) End date, and 4) Reason. Would you like me to open the leave request form?',
        'Sure! I can help with your leave request. Your current leave balance is: Annual: 18 days, Sick: 8 days, Personal: 4 days. What dates are you looking at?',
      ],
      action: 'create_leave_request',
    },
    {
      intent: 'leave_balance',
      patterns: [
        'leave balance',
        'how many days',
        'remaining leave',
        'vacation days left',
        'check.*balance',
      ],
      responses: [
        'Your current leave balance is:\n• Annual Leave: 18 days remaining\n• Sick Leave: 8 days remaining\n• Personal Leave: 4 days remaining',
        'Let me check your balance... You have 18 days of annual leave, 8 sick days, and 4 personal days available.',
        'Here\'s your leave summary: Annual (18/25 days used), Sick (2/10 days used), Personal (1/5 days used).',
      ],
      action: 'view_leave_balance',
    },
    {
      intent: 'shift_swap',
      patterns: [
        'swap shift',
        'exchange shift',
        'trade shift',
        'switch.*with',
        'swap.*colleague',
      ],
      responses: [
        'I can help you swap shifts with a colleague. Which shift would you like to swap, and do you have someone in mind to swap with?',
        'To initiate a shift swap: 1) Select your shift, 2) Choose a colleague, 3) Select their shift to swap. Both parties need to accept before supervisor approval.',
        'Shift swaps require mutual agreement and supervisor approval. Would you like me to show you available colleagues for swapping?',
      ],
      action: 'create_swap_request',
    },
    {
      intent: 'who_working',
      patterns: [
        'who.*working',
        'who.*on shift',
        'team.*today',
        'colleagues.*working',
        'staff.*schedule',
      ],
      responses: [
        'For today\'s shifts:\n• Morning (6AM-2PM): James, Emma, Oliver, Sophia\n• Afternoon (2PM-10PM): William, Ava, Benjamin\n• Night (10PM-6AM): Lucas, Mia',
        'Let me check the roster... There are 12 employees scheduled today across all shifts. Would you like details for a specific shift or department?',
        'Today\'s coverage: Morning shift has 4 staff, Afternoon has 3 staff, and Night shift has 2 staff. All positions are filled.',
      ],
      action: 'view_team_schedule',
    },
    {
      intent: 'help',
      patterns: [
        'help',
        'what can you do',
        'commands',
        'options',
        'how.*use',
      ],
      responses: [
        'I can help you with:\n• 📅 View your schedule\n• 🏖️ Request leave\n• 🔄 Swap shifts\n• 👥 See who\'s working\n• 📊 Check reports\n• ⚙️ Update preferences\n\nJust ask me anything!',
        'Here\'s what I can do:\n1. Show your schedule and shifts\n2. Help request time off\n3. Initiate shift swaps\n4. Check team schedules\n5. Answer policy questions\n\nWhat would you like help with?',
      ],
    },
    {
      intent: 'greeting',
      patterns: [
        '^hi$',
        '^hello$',
        '^hey$',
        'good morning',
        'good afternoon',
        'good evening',
      ],
      responses: [
        'Hello! How can I help you with your shifts today?',
        'Hi there! I\'m here to help with scheduling, leave requests, and more. What do you need?',
        'Hey! Ready to help with your shift management needs. What can I do for you?',
      ],
    },
    {
      intent: 'thanks',
      patterns: [
        'thank',
        'thanks',
        'appreciate',
        'helpful',
      ],
      responses: [
        'You\'re welcome! Let me know if you need anything else.',
        'Happy to help! Is there anything else I can assist with?',
        'Anytime! Feel free to ask if you have more questions.',
      ],
    },
    {
      intent: 'overtime',
      patterns: [
        'overtime',
        'extra hours',
        'additional shift',
        'pick up shift',
      ],
      responses: [
        'Looking for overtime opportunities? There are 3 open shifts this week that need coverage. Would you like to see them?',
        'I can show you available overtime shifts. Currently, there are openings on Saturday morning and Sunday afternoon. Interested?',
        'Overtime shifts are available! Check the schedule page for open shifts marked as "Needs Coverage". I can also notify you when new opportunities arise.',
      ],
      action: 'view_overtime',
    },
    {
      intent: 'report',
      patterns: [
        'report',
        'analytics',
        'statistics',
        'metrics',
        'hours worked',
      ],
      responses: [
        'I can help with reports! Available reports include: Coverage Analysis, Overtime Summary, Attendance Tracking, and Compliance Reports. Which one interests you?',
        'For reporting, you can access: Weekly hours summary, Monthly attendance, Overtime tracking, and Team coverage metrics. What would you like to see?',
        'Your personal stats this month: 160 hours worked, 8 hours overtime, 100% attendance. Would you like a detailed breakdown?',
      ],
      action: 'view_reports',
    },
  ],
  fallbackResponses: [
    'I\'m not sure I understand. Could you rephrase that? I can help with schedules, leave requests, shift swaps, and more.',
    'I didn\'t quite catch that. Try asking about your schedule, requesting leave, or swapping shifts.',
    'Hmm, I\'m not sure how to help with that. Here are some things I can do: show schedules, process leave requests, help with shift swaps.',
    'I\'m still learning! Could you try asking in a different way? Or type "help" to see what I can do.',
  ],
  suggestions: {
    schedule_inquiry: ['Request leave', 'Swap a shift', 'Who else is working?'],
    leave_request: ['Check leave balance', 'View schedule', 'Cancel request'],
    leave_balance: ['Request leave', 'View schedule', 'See policy'],
    shift_swap: ['View schedule', 'See available colleagues', 'Cancel'],
    who_working: ['View full schedule', 'Contact colleague', 'Request swap'],
    help: ['Show my schedule', 'Request leave', 'Swap shifts'],
    greeting: ['Show my schedule', 'Check leave balance', 'Help'],
    overtime: ['View open shifts', 'My schedule', 'Overtime policy'],
    report: ['Coverage report', 'My hours', 'Team stats'],
  },
}

export default chatbotResponses
