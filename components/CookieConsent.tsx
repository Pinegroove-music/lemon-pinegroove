import React, { useEffect } from 'react';
import * as CookieConsentLib from 'vanilla-cookieconsent';
import { useStore } from '../store/useStore';

export const CookieConsent: React.FC = () => {
  const { isDarkMode } = useStore();

  useEffect(() => {
    CookieConsentLib.run({
        guiOptions: {
            consentModal: {
                layout: 'box', // Square-ish layout
                position: 'bottom right', // Bottom right corner
                equalWeightButtons: true,
                flipButtons: false
            }
        },
        categories: {
            necessary: {
                readOnly: true
            }
        },
        language: {
            default: 'en',
            translations: {
                en: {
                    consentModal: {
                        title: 'Notice',
                        description: 'We use only essential cookies to ensure secure payments via Lemon Squeezy and a smooth experience. No tracking or profiling cookies are used.',
                        acceptAllBtn: 'I understand',
                        footer: `
                            <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed rgba(0,0,0,0.1);">
                                <a href="#/privacy" style="font-weight: 700; color: #0ea5e9; text-decoration: none; font-size: 12px;">Privacy Policy</a>
                            </div>
                        `
                    },
                    // Added required preferencesModal property to fix TypeScript error
                    preferencesModal: {
                        title: 'Cookie Preferences',
                        acceptAllBtn: 'Accept all',
                        acceptNecessaryBtn: 'Reject all',
                        savePreferencesBtn: 'Save preferences',
                        closeIconLabel: 'Close modal',
                        sections: [
                            {
                                title: 'Cookie Usage',
                                description: 'We use only essential cookies to ensure secure payments via Lemon Squeezy and a smooth experience.'
                            }
                        ]
                    }
                }
            }
        }
    });
  }, []);

  useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.add('cc--darkmode');
    } else {
        document.documentElement.classList.remove('cc--darkmode');
    }
  }, [isDarkMode]);

  return null;
};