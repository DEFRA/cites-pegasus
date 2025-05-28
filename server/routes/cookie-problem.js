const Joi = require("joi");
const textContent = require("../content/text-content");
const { urlPrefix } = require("../../config/config");
const pageId = "cookie-problem";
const currentPath = `${urlPrefix}/${pageId}`;
const paymentRoutes = ["account", "new-application"];

function createModel(paymentRoute) {
  const commonContent = textContent.common;
  const pageContent = textContent.cookieProblem;
  // const returnToYourApplicationsUrl = `${urlPrefix}/`;
  const returnToYourApplicationsUrl = `${urlPrefix}/login`;
  const pageTitle = pageContent.defaultTitle + commonContent.pageTitleSuffix;
  const wildLifeLicensingEmailAddress =  `${urlPrefix}`;
  console.log("urlPrefix: ", urlPrefix);
  // return h.redirect(`/login`)
  return {
    ...commonContent,
    ...pageContent,
    wildLifeLicensingEmailAddress,
    returnToYourApplicationsUrl,
    paymentRoute,
    pageTitle,
  };
}

module.exports = [
  {
    method: "GET",
    path: `${currentPath}/{paymentRoute}`,
    config: {
      auth: false,
      validate: {
        params: Joi.object({
          paymentRoute: Joi.string().valid(...paymentRoutes),
        }),
        failAction: (_request, _h, error) => {
          console.log(error);
        },
      },

      handler: async (request, h) => {
        return h.view(pageId, createModel(request.params.paymentRoute));
      },
    },
  },
];
