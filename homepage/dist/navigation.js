'use strict';
const additionalJohnsServices = {
  garage: {
    name: 'Mechanical garage', image: 'garage.webp',
    intro: 'Tell us about your vehicle and what needs attention. The team will get back to you about the work, a suitable time and a quote.',
    options: ['Routine service', 'Diagnostics', 'Repairs', 'Something else'],
    detailLabel: 'Your vehicle', detailPlaceholder: 'Make, model and registration, if known',
    messagePlaceholder: 'Describe the issue, any warning lights, or the work you have in mind.'
  },
  wash: {
    name: 'Car wash & detailing', image: 'car-wash.webp',
    intro: 'Let us know how you would like your vehicle cared for. The team will confirm a suitable package, price and available time.',
    options: ['Exterior wash', 'Interior clean', 'Full valet', 'Detailing', 'Help me choose'],
    detailLabel: 'Your vehicle', detailPlaceholder: 'Make, model and vehicle size',
    messagePlaceholder: 'Tell us what you need, including any areas that need extra attention.'
  },
  leasing: {
    name: 'Vehicle leasing', image: 'fleet.webp',
    intro: 'Looking for a vehicle for yourself or your business? Share what you need and the team will help you explore suitable leasing options.',
    options: ['Small car', 'Family car', 'Executive car', 'People carrier', 'Commercial vehicle', 'Help me choose'],
    detailLabel: 'Preferred lease term', detailPlaceholder: 'For example, 12 months or 3 years',
    messagePlaceholder: 'Tell us about your intended use, approximate mileage and preferred budget.'
  }
};

function closeJohnsServiceMenus() {
  document.querySelectorAll('.services-menu,.mobile-services-menu').forEach(menu => menu.open = false);
  const menu = document.querySelector('#mobile-menu');
  menu.hidden = true;
  const toggle = document.querySelector('.menu-toggle');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open menu');
}

function showAdditionalJohnsEnquiry(type) {
  const item = additionalJohnsServices[type];
  if (!item) return;
  closeJohnsServiceMenus();
  openModal(`<div class="dialog-content additional-enquiry">
    <h2 id="dialog-title">${item.name}</h2>
    <p class="intro">${item.intro}</p>
    <img class="enquiry-service-photo" src="assets/${item.image}" alt="${item.name} service illustration">
    <form id="additional-service-form" data-enquiry-type="${type}">
      <div class="form-grid">
        ${field('Your name *', '<input id="other-name" name="name" autocomplete="name" maxlength="120" required>')}
        ${field('Email address *', '<input id="other-email" name="email" type="email" autocomplete="email" maxlength="200" required>')}
        ${field('Phone number', '<input id="other-phone" name="phone" type="tel" autocomplete="tel" placeholder="Include your country code" maxlength="40">')}
        ${field(type === 'leasing' ? 'Vehicle type *' : 'What can we help with? *', `<select id="other-option" name="option" required>${options(item.options, item.options[0])}</select>`)}
        ${field(item.detailLabel, `<input id="other-details" name="vehicleDetails" placeholder="${item.detailPlaceholder}" maxlength="250">`, 'wide')}
        ${field(type === 'leasing' ? 'When would you need the vehicle?' : 'Preferred date', `<input id="other-date" name="preferredDate" type="date" min="${today}">`)}
        ${type === 'leasing' ? field('Company, if applicable', '<input id="other-company" name="company" autocomplete="organization" maxlength="150">') : field('Preferred time of day', '<select id="other-time" name="preferredTime"><option>No preference</option><option>Morning</option><option>Afternoon</option></select>')}
        ${field('Tell us a little more', `<textarea id="other-message" name="message" placeholder="${item.messagePlaceholder}" maxlength="1500"></textarea>`, 'wide')}
      </div>
      <label class="check-label"><input type="checkbox" name="contactConsent" required><span>I agree to be contacted about this enquiry.</span></label>
      <p class="enquiry-explanation">This is an enquiry, not a confirmed booking. The team will confirm availability and pricing with you. This design preview does not send the form.</p>
      <div class="dialog-actions"><button class="text-button" type="button" data-action="close">Back to John’s</button><button class="button button-dark" type="submit">Preview enquiry <span>→</span></button></div>
    </form>
  </div>`);
}

document.addEventListener('click', event => {
  const entry = event.target.closest('[data-enquiry]');
  if (entry) {
    event.preventDefault();
    showAdditionalJohnsEnquiry(entry.dataset.enquiry);
    return;
  }
  if (event.target.closest('[data-service]')) closeJohnsServiceMenus();
  if (!event.target.closest('.services-menu')) document.querySelectorAll('.services-menu').forEach(menu => menu.open = false);
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const openMenu = document.querySelector('.services-menu[open]');
  if (openMenu) {
    openMenu.open = false;
    openMenu.querySelector('summary').focus();
  }
  if (!document.querySelector('#mobile-menu').hidden) closeJohnsServiceMenus();
});

document.addEventListener('submit', event => {
  if (event.target.id !== 'additional-service-form') return;
  event.preventDefault();
  if (!event.target.checkValidity()) { event.target.reportValidity(); return; }
  const type = event.target.dataset.enquiryType;
  const data = Object.fromEntries(new FormData(event.target));
  const item = additionalJohnsServices[type];
  openModal(`<div class="dialog-content"><div class="success-state">
    <div class="success-icon">✓</div><h2 id="dialog-title">Your ${type === 'leasing' ? 'leasing' : type === 'wash' ? 'car care' : 'garage'} enquiry, ready to go.</h2>
    <p>Thanks, ${escapeHtml(data.name)}. In the live website, this would reach the John’s team so they can contact you about your request.</p>
    <div class="enquiry-success-detail"><strong>${item.name}</strong><p>${escapeHtml(data.option)}${data.vehicleDetails ? '<br>' + escapeHtml(data.vehicleDetails) : ''}${data.preferredDate ? '<br>Preferred date: ' + dateLabel(data.preferredDate) : ''}</p></div>
    <p>No appointment, lease or payment has been confirmed. This is a design preview; your details have not been sent.</p>
    <a class="underlink" href="tel:+35622982123">Speak to the team: +356 2298 2123 <span>↗</span></a>
    <div class="dialog-actions"><button class="text-button" data-enquiry="${type}">Start another enquiry</button><button class="button button-dark" data-action="close">Done <span>✓</span></button></div>
  </div></div>`);
});
