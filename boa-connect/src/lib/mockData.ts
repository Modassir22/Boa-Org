// Constants and Options (not dummy data)

export const delegateCategories = [
  { value: 'boa-member', label: 'BOA Member' },
  { value: 'non-boa-member', label: 'Non-BOA Member' },
  { value: 'accompanying-person', label: 'Accompanying Person' }
];

export const titleOptions = [
  { value: 'dr', label: 'Dr.' },
  { value: 'prof', label: 'Prof.' },
  { value: 'mr', label: 'Mr.' },
  { value: 'mrs', label: 'Mrs.' },
  { value: 'ms', label: 'Ms.' }
];

export const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];

export const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

// Temporary active seminar placeholder (will be replaced by API)
export const activeSeminar = {
  id: '1',
  name: 'BOA 2026, Siliguri',
  location: 'Siliguri, West Bengal',
  venue: 'Siliguri Convention Center',
  startDate: '2026-02-15',
  endDate: '2026-02-18',
  registrationStart: '2025-08-01',
  registrationEnd: '2026-01-31',
  isActive: true,
  description: 'Join us for the most prestigious ophthalmic conference in Bihar.',
  image: '/placeholder.svg'
};

