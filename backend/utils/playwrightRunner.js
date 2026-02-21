const { chromium } = require('playwright');
const { expect } = require('@playwright/test');

/**
 * Executes a basic Black Box test on a target URL using Playwright.
 * @param {Object} params - The object containing test parameters
 * @returns {Promise<Object>} Object containing status, actualResult, and executionTimeMs
 */
const runPlaywrightTest = async (params) => {
    let browser;
    const startTime = Date.now();
    let status = 'Failed';
    let actualResult = '';

    const {
        testType,
        targetUrl,
        locatorStrategy,
        targetSelector,
        expectedText,
        usernameSelector,
        usernameValue,
        passwordSelector,
        passwordValue,
        submitSelector,
        assertionSelector
    } = params;

    try {
        // Launch headless Chromium
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        switch (testType) {
            case 'ping': {
                // Navigate to the target URL
                const response = await page.goto(targetUrl, { waitUntil: 'load', timeout: 30000 });

                // Basic check 1: Ensure URL loaded (status 2xx)
                if (!response || !response.ok()) {
                    throw new Error(`Failed to load page. HTTP Status: ${response ? response.status() : 'Unknown'}`);
                }

                // Basic check 2: Dynamic Selector Waiting (ensure body is present and visible)
                await page.waitForSelector('body', { state: 'visible', timeout: 10000 });

                status = 'Passed';
                actualResult = 'Successfully loaded the page and detected the body element.';
                break;
            }
            case 'assertion': {
                await page.goto(targetUrl, { waitUntil: 'load', timeout: 30000 });
                let locator;
                if (locatorStrategy === 'getByRole') {
                    locator = page.getByRole(targetSelector);
                } else if (locatorStrategy === 'getByTestId') {
                    locator = page.getByTestId(targetSelector);
                } else {
                    locator = page.locator(targetSelector);
                }

                await expect(locator).toHaveText(expectedText);
                status = 'Passed';
                actualResult = `Text assertion passed for selector "${targetSelector}" with expected text "${expectedText}".`;
                break;
            }
            case 'login': {
                await page.goto(targetUrl, { waitUntil: 'load', timeout: 30000 });

                // 1. Define Smart Fallback Locators
                const smartUser = page.locator('input[type="email"], input[name="username"], input[name="email"]');
                const smartPass = page.locator('input[type="password"]');
                const smartSubmit = page.locator('button[type="submit"], input[type="submit"]');

                // 2. Dynamic Assignment
                const finalUserLocator = (params.usernameSelector && params.usernameSelector !== '') ? page.locator(params.usernameSelector) : smartUser;
                const finalPassLocator = (params.passwordSelector && params.passwordSelector !== '') ? page.locator(params.passwordSelector) : smartPass;
                const finalSubmitLocator = (params.submitSelector && params.submitSelector !== '') ? page.locator(params.submitSelector) : smartSubmit;

                try {
                    // 3. Execution Step
                    await finalUserLocator.fill(params.usernameValue);
                    await finalPassLocator.fill(params.passwordValue);
                    await finalSubmitLocator.click();

                    await expect(page.locator(params.assertionSelector)).toBeVisible({ timeout: 5000 });

                    status = 'Passed';
                    actualResult = `Login flow completed successfully. Assertion element "${params.assertionSelector}" is visible.`;
                } catch (error) {
                    // 4. Error Handling
                    status = 'Failed';
                    let scrapedError = error.message;
                    try {
                        const errorLocator = page.locator('.error, .error-message, [role="alert"]');
                        if (await errorLocator.count() > 0) {
                            scrapedError = await errorLocator.first().textContent();
                        }
                    } catch (e) {
                        // Ignore inner error scraping errors
                    }
                    actualResult = `Login Failed. Page displayed: '${scrapedError.trim()}'`;
                }
                break;
            }
            default:
                throw new Error(`Unknown testType: ${testType}`);
        }

    } catch (error) {
        status = 'Failed';
        actualResult = `Error: ${error.message}`;
        console.error('Playwright Test Error:', error);
    } finally {
        // ALWAYS close the browser to prevent memory leaks
        if (browser) {
            await browser.close();
        }

        const endTime = Date.now();
        const executionTimeMs = endTime - startTime;

        return {
            status,
            actualResult,
            executionTimeMs
        };
    }
};

module.exports = {
    runPlaywrightTest
};
