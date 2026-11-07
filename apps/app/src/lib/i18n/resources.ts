import adminHome from '@/locales/cs/admin-home.json';
import campPages from '@/locales/cs/camp-pages.json';
import camps from '@/locales/cs/camps.json';
import common from '@/locales/cs/common.json';
import consoleTexts from '@/locales/cs/console.json';
import invitation from '@/locales/cs/invitation.json';
import login from '@/locales/cs/login.json';
import members from '@/locales/cs/members.json';
import organisationSettings from '@/locales/cs/organisation-settings.json';
import passwordReset from '@/locales/cs/password-reset.json';
import signup from '@/locales/cs/signup.json';

export const defaultNamespace = 'common';

export const resources = {
  cs: {
    common,
    signup,
    adminHome,
    login,
    passwordReset,
    members,
    invitation,
    organisationSettings,
    camps,
    campPages,
    console: consoleTexts,
  },
};
