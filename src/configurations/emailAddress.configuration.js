/* cSpell:disable */
const commonEmailAddressDomainsList = [
	'gmail.com',
	'hotmail.com',
	'yahoo.com',
	'outlook.com',
	'walla.co.il',
	'walla.com',
	'bezeqint.net',
	'netvision.net.il'
];

const filterEmailAddresses = [
	'nurit.fadida@gmail.com',
	'amit@amit-segal.com',
	'your.name@provider.com',
	'email@email.com',
	'your@friend.email'
];

const filterEmailAddressDomains = [
	'123.co',
	'123.co.il',
	'aaa.co',
	'aaa.co.il',
	'domain.com',
	'domain.web',
	'example.com',
	'example.web',
	'iana.org',
	'email.com',
	'no_such_domain.com',
	'provider.com',
	'nosuchdomain.com',
	'test.com',
	'friend.email',
	'yourdomain.com',
	'justice.gov.il',
	'police.gov.il',
	'taxes.gov.il',
	'knesset.gov.il',
	'court.gov.il',
	'knesset.tv'
];

const invalidDomains = [
	'ingest.sentry.io',
	'sentry.indeed.com',
	'sentrylabs.indeed.com',
	'app.getsentry.com',
	'sentry.io',
	'sentry.issuu.com',
	'1000xbetslots.xyz',
	'group.calendar.google.com',
	'template.index',
	'template.product',
	'template.account.plans',
	'sentry.wixpress.com',
	'posting.google.com'
];

module.exports = { commonEmailAddressDomainsList, filterEmailAddresses, filterEmailAddressDomains, invalidDomains };