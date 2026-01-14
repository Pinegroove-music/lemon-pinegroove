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
            },
            analytics: {}
        },
        language: {
            default: 'en',
            translations: {
                en: {
                    consentModal: {
                        title: 'Cookies & Privacy',
                        description: 'We use cookies to enhance your experience and secure your purchases via Lemon Squeezy.',
                        acceptAllBtn: 'I Accept',
                        acceptNecessaryBtn: 'I Decline',
                        footer: `
                            <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed rgba(0,0,0,0.1);">
                                <a href="/privacy" style="font-weight: 700; color: #0ea5e9; text-decoration: none; font-size: 12px;">Privacy Policy</a>
                            </div>
                        `
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