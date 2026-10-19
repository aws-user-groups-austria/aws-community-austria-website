/**
 * Every company the site shows a logo for, in one place: the sponsor wall
 * (home carousel, sponsors page) and the hosts of each meetup (event cards,
 * /meetups/, /meetups/<id>/). Logo files live in public/assets/sponsors/
 * (sources in its README).
 *
 * A host is looked up by name with findCompany(): the name or one of the
 * aliases, after lower-casing and dropping legal forms (GmbH, AG, & Co KG).
 * Matching is exact, never by prefix, so "Raiffeisen Informatik" and
 * "Raiffeisen Bank International" stay two companies. A host that is not
 * listed here is shown by name, never with another company's logo.
 */

export interface Company {
  name: string;
  logo: string;            // file in public/assets/sponsors/
  url: string;
  aliases?: string[];      // other spellings, e.g. the name in a Meetup title "hosted by X"
  wall?: boolean;          // shown on the sponsor wall ("Our Sponsors", "All past sponsors")
  dark?: boolean;          // the logo is made for a dark background (white lettering): shown on navy, not white
  about?: string;          // what the company is and does, for the host's details on a meetup page
  aws?: string;            // its public relation to AWS (case studies, partner status), only what a public source says
}

export const COMPANIES: Company[] = [
  { name: "EBCONT",                        logo: "ebcont.png",                url: "https://www.ebcont.com",              wall: true },
  {
    name: "SQUER", logo: "squer.svg", url: "https://www.squer.io", wall: true,
    // squer.io/about, squer.io/services/cloud-infrastructure; listed in the AWS Partner Solutions Finder
    about: "SQUER is a software development and agile transformation consultancy in Vienna and Munich, working on system design, software modernization, platform engineering and cloud infrastructure, and runs community meetups of its own.",
    aws: "SQUER is an AWS Advanced Tier Services Partner.",
  },
  { name: "Cloudflight",                   logo: "cloudflight.png",           url: "https://www.cloudflight.io",          wall: true },
  { name: "Dynatrace",                     logo: "dynatrace.png",             url: "https://www.dynatrace.com",           wall: true },
  {
    name: "Raiffeisen Informatik", logo: "raiffeisen_informatik.svg", url: "https://www.raiffeiseninformatik.at", wall: true, aliases: ["R-IT", "Raiffeisen Informatik GmbH & Co KG"],
    // raiffeiseninformatik.at/unternehmen/; no public AWS relation confirmed (October 2026)
    about: "Raiffeisen Informatik is a Vienna-based IT service provider and high-security data centre operator for banks and insurers. Founded in 1969 and majority-owned by Raiffeisen banking entities, it has about 1,100 employees in three countries.",
  },
  {
    name: "Raiffeisen Bank International", logo: "rbi.svg", url: "https://www.rbinternational.com", wall: true, aliases: ["RBI", "Raiffeisen Bank International AG"],
    // rbinternational.com/en/raiffeisen/rbi-group/about-us.html; AWS case studies "Raiffeisen Bank International Launches Scalable Finance Platform Using AWS" (2022) and the RBI video case study (2024)
    about: "Raiffeisen Bank International (RBI), headquartered in Vienna, is one of Austria's leading corporate and investment banks and a universal bank in 11 markets in Central and Eastern Europe, serving 18.8 million customers with around 42,000 employees.",
    aws: "RBI chose AWS as its first public cloud provider and built its Merlin platform on it, where more than 50 engineering teams run their services; by 2024 the bank had moved more than 40 percent of its applications to AWS. RBI engineers have presented this work at AWS Summits in Zurich and Hamburg.",
  },
  {
    name: "Eversports", logo: "eversports.svg", url: "https://www.eversports.at", wall: true, aliases: ["eversports.at", "Eversport GmbH", "Eversports GmbH"],
    // eversportsmanager.com; brutkasten.com/videos/aws-tech-talk-eversports (2020)
    about: "Eversports is a Vienna-based company that runs a platform connecting sports studios, venues, trainers and athletes, and makes Eversports Manager, booking and management software for studios and sports facilities.",
    aws: "Eversports runs on AWS: in 2020 its CTO and lead software architect talked about their work with the AWS Austria team in an AWS Tech Talk with brutkasten.",
  },
  {
    name: "ByteSource", logo: "bytesource.svg", url: "https://bytesource.net", wall: true, aliases: ["Bytesource", "bytesource.net"],
    // bytesource.net/en/; listed in the AWS Partner Solutions Finder
    about: "ByteSource is a Vienna-based IT consultancy for cloud, DevOps, Atlassian, agile software development and AI, with offices in Vienna and Munich.",
    aws: "ByteSource is an AWS Premier Tier Services Partner and describes itself as the first one in Austria.",
  },
  {
    name: "DoIT", logo: "doit.png", url: "https://www.doit.com", wall: true, aliases: ["DoiT", "DoiT International", "doit.com"],
    // doit.com/about; listed in the AWS Partner Solutions Finder
    about: "DoiT, founded in 2011, helps companies run the cloud and keep its costs in check, with its Cloud Intelligence software and expert engineers across AWS, Google Cloud and Microsoft Azure.",
    aws: "DoiT is an AWS Premier Tier Services Partner.",
  },
  {
    name: "TU Wien", logo: "tu_wien.svg", url: "https://www.tuwien.at", wall: true, aliases: ["Technische Universität Wien"],
    // en.wikipedia.org/wiki/TU_Wien; lkovacs.com/AWS_TUW_CS2.html (2023)
    about: "TU Wien is a public research university in Vienna and Austria's largest scientific and technical research and teaching institution.",
    aws: "In 2023 TU Wien ran a computer science project course together with AWS, taught by members of AWS's Solutions Architect team in Austria.",
  },
  {
    name: "enspired", logo: "enspired.png", url: "https://www.enspired-trading.com", wall: true, aliases: ["enspired GmbH"],
    // enspired-trading.com/about-us; no public AWS relation confirmed (October 2026)
    about: "enspired, founded in 2020 and based in Vienna, runs an algorithmic trading and optimization platform for battery energy storage and other flexible assets across European power markets.",
  },
  { name: "APA Tech",                      logo: "apa_tech.png",              url: "https://www.apa.at",                  wall: true, aliases: ["APA-Tech"] },
  { name: "Nordcloud",                     logo: "nordcloud.png",             url: "https://nordcloud.com",               wall: true },
  {
    name: "Labyrinth Labs", logo: "labyrinth_labs.svg", url: "https://lablabs.io", wall: true,
    // lablabs.io, lablabs.io/partners; listed in the AWS Partner Solutions Finder
    about: "Labyrinth Labs is a cloud consultancy from Bratislava that builds and runs scalable, cloud-native platforms, with AWS migration, optimization and Kubernetes (Amazon EKS) platforms at its core.",
    aws: "Labyrinth Labs is an AWS Advanced Tier Services Partner and was named AWS Consulting Partner of the Year CEE in 2024 and 2025, as it says on its site.",
  },
  { name: "ML Reply",                      logo: "mlreply.png",               url: "https://www.reply.com/machine-learning-reply/de", wall: true },
  { name: "Red Hat",                       logo: "red_hat.png",               url: "https://www.redhat.com",              wall: true },
  { name: "tecRacer",                      logo: "tecracer.png",              url: "https://www.tecracer.com",            wall: true },
  { name: "Adverity",                      logo: "adverity.png",              url: "https://www.adverity.com",            wall: true },
  { name: "Auvaria",                       logo: "auvaria.png",               url: "https://www.auvaria.com",             wall: true },
  { name: "Trend Micro",                   logo: "trend_micro.png",           url: "https://www.trendmicro.com",          wall: true },
  { name: "VMware",                        logo: "vmware.png",                url: "https://www.vmware.com",              wall: true },
  { name: "Viesure",                       logo: "viesure.png",               url: "https://www.viesure.com",             wall: true },
];

/** Lower case, no accents, no legal form, single spaces: "Raiffeisen Bank International AG" -> "raiffeisen bank international". */
export function companyKey(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " & ")
    .replace(/[^a-z0-9&]+/g, " ")
    .replace(/(^|\s)(gmbh|ag|kg|co|inc|ltd|llc|&)(?=\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const BY_KEY = new Map<string, Company>();
for (const c of COMPANIES) {
  for (const n of [c.name, ...(c.aliases ?? [])]) {
    const key = companyKey(n);
    const other = BY_KEY.get(key);
    if (other && other !== c) throw new Error(`sponsors.ts: "${n}" is listed for both ${other.name} and ${c.name}`);
    BY_KEY.set(key, c);
  }
}

/** The company for a host or sponsor name, or undefined when the site has no logo for it. */
export function findCompany(name: string): Company | undefined {
  return BY_KEY.get(companyKey(name));
}

export function logoSrc(c: Company): string {
  return `${import.meta.env.BASE_URL}assets/sponsors/${c.logo}`;
}

/** The sponsor wall: home carousel and the sponsors page. */
export const SPONSORS: Company[] = COMPANIES.filter((c) => c.wall);
