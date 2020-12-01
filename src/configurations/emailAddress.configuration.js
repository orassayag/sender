/* cSpell:disable */
const invalidDomains = [
	'ingest.sentry.io',
	'sentrylabs.indeed.com',
	'app.getsentry.com',
	'sentry.io',
	'sentry.issuu.com',
	'1000xbetslots.xyz'
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
	'no_such_domain.com',
	'nosuchdomain.com',
	'test.com',
	'yourdomain.com',
	'justice.gov.il',
	'police.gov.il',
	'taxes.gov.il',
	'knesset.gov.il'
];

const filterEmailAddresses = [
	'nurit.fadida@gmail.com'
];

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

module.exports = { invalidDomains, filterEmailAddressDomains, filterEmailAddresses, commonEmailAddressDomainsList };