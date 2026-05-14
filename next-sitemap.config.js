/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://docs.hivedeploy.in',
  generateRobotsTxt: true,
  outDir: 'public',
  exclude: ['/api/*'],
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: '/api/' },
    ],
    additionalSitemaps: ['https://docs.hivedeploy.in/sitemap.xml'],
  },
}
