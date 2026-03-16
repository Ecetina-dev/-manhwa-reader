import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	// Test directory
	testDir: './tests/e2e',
	
	// Run tests in parallel
	fullyParallel: true,
	
	// Fail build on CI if tests fail
	forbidOnly: !!process.env.CI,
	
	// Retry on CI
	retries: process.env.CI ? 2 : 0,
	
	// Workers on CI
	workers: process.env.CI ? 1 : undefined,
	
	// Reporter
	reporter: [
		['html', { outputFolder: 'test-results/html' }],
		['json', { outputFile: 'test-results/results.json' }],
		['list'],
	],
	
	// Shared settings
	use: {
		// Base URL
		baseURL: process.env.BASE_URL || 'http://localhost:4173',
		
		// Collect traces on failure
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
		
		// Locale
		locale: 'es-ES',
	},
	
	// Projects
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		
		// Mobile test
		{
			name: 'Mobile Chrome',
			use: { ...devices['Pixel 5'] },
		},
	],
	
	// Web server
	webServer: {
		command: 'npm run preview',
		url: process.env.BASE_URL || 'http://localhost:4173',
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
	},
});
