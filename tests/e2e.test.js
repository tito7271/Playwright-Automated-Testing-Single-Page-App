const { test, describe, beforeEach, afterEach, beforeAll, afterAll, expect } = require('@playwright/test')
const { assert, log } = require('console')
const { chromium } = require('playwright')

const host = 'http://localhost:3000'

let browser
let context
let page

let user = {
    email: '',
    password: '123456',
    confirmPass: '123456'
}

let game = {
    title: 'Random title',
    category: 'Random category',
    maxLevel: '71',
    imageUrl: './images/ZombieLang.png',
    summary: 'Random summary'
}

describe('e23 tests', () => {
    beforeAll(async () => {
        browser = await chromium.launch()
    })

    afterAll(async () => {
        await browser.close()
    })

    beforeEach(async () => {
        context = await browser.newContext()
        page = await context.newPage()
    })

    afterEach(async () => {
        await page.close()
        await context.close()
    })

    describe('authentication', () => {
        test('register makes correct API call', async () => {
            // Arrange
            await page.goto(host)

            let random = Math.floor(Math.random() * 10000)
            user.email = `test${random}@mail.com`

            // Act
            await page.click('a[href="/register"]')
            await page.waitForSelector('form[id="register"]')

            await page.locator('input[id="email"]').fill(user.email)
            await page.locator('input[id="register-password"]').fill(user.password)
            await page.locator('input[id="confirm-password"]').fill(user.confirmPass)

            let [response] = await Promise.all([
                page.waitForResponse(response => response.url().includes('/users/register') && response.status() === 200),
                page.click('input[type="submit"]')
            ])
            let userData = await response.json()

            // Assert
            await expect(response.ok()).toBeTruthy()
            expect(userData.email).toBe(user.email)
            expect(userData.password).toEqual(user.password)
        })

        test('register does not work with empty input fields', async () => {
            // Arrange
            await page.goto(host)

            // Act
            await page.click('a[href="/register"]')
            await page.waitForSelector('form[id="register"]')
            await page.click('input[type="submit"]')

            // Assert
            expect(page.url()).toBe(host + '/register')
        })

        test('login makes correct API call', async () => {
            // Arrange
            await page.goto(host)
            await page.click('nav a[href="/login"]')
            await page.waitForSelector('form[id="login"]')

            // Act
            await page.locator('input[id="email"]').fill(user.email)
            await page.locator('input[id="login-password"]').fill(user.password)

            let [response] = await Promise.all([
                page.waitForResponse(response => response.url().includes('/users/login') && response.status() === 200),
                page.click('input[type="submit"]')
            ])
            let userData = await response.json()

            // Assert
            expect(response.ok()).toBeTruthy()
            expect(userData.email).toBe(user.email)
            expect(userData.password).toEqual(user.password)
        })

        test('login does not work with empty input fields', async () => {
            // Arrange
            await page.goto(host)
            await page.click('nav a[href="/login"]')
            await page.waitForSelector('form[id="login"]')

            // Act
            await page.click('input[type="submit"]')

            // Assert
            expect(page.url()).toBe(host + '/login')
        })

        test('logout makes correct API call', async () => {
            // Arrange
            await page.goto(host)
            await page.click('nav a[href="/login"]')
            await page.waitForSelector('form[id="login"]')

            await page.locator('input[id="email"]').fill(user.email)
            await page.locator('input[id="login-password"]').fill(user.password)
            await page.click('input[type="submit"]')

            // Act
            let [response] = await Promise.all([
                page.waitForResponse(response => response.url().includes('/users/logout') && response.status() === 204),
                page.click('nav a[href="/logout"]')
            ])
            await page.waitForSelector('nav a[href="/login"]')

            // Assert
            expect(response.ok()).toBeTruthy()
            expect(page.url()).toBe(host + '/')
        })
    })

    describe('navigation bar', () => {
        test('logged in user should see correct navigation buttons', async () => {
            // Arrange
            await page.goto(host)

            // Act
            await page.click('nav a[href="/login"]')
            await page.waitForSelector('form[id="login"]')
            await page.locator('input[id="email"]').fill(user.email)
            await page.locator('input[id="login-password"]').fill(user.password)
            await page.click('input[type="submit"]')

            // Assert
            await expect(page.locator('nav a[href="/catalog"]')).toBeVisible()
            await expect(page.locator('nav a[href="/create"]')).toBeVisible()
            await expect(page.locator('nav a[href="/logout"]')).toBeVisible()

            await expect(page.locator('nav a[href="/login"]')).toBeHidden()
            await expect(page.locator('nav a[href="/register"]')).toBeHidden()
        })

        test('guest user should see correct navigation buttons', async () => {
            // Act
            await page.goto(host)

            // Assert
            await expect(page.locator('nav a[href="/create"]')).toBeHidden()
            await expect(page.locator('nav a[href="/logout"]')).toBeHidden()

            await expect(page.locator('nav a[href="/catalog"]')).toBeVisible()
            await expect(page.locator('nav a[href="/login"]')).toBeVisible()
            await expect(page.locator('nav a[href="/register"]')).toBeVisible()
        })
    })

    describe('games functionality', () => {
        beforeEach(async () => {
            await page.goto(host)
            await page.click('nav a[href="/login"]')
            await page.waitForSelector('form[id="login"]')
            await page.locator('input[id="email"]').fill(user.email)
            await page.locator('input[id="login-password"]').fill(user.password)
            await page.click('input[type="submit"]')
        })

        test('create does not work with empty input fields', async () => {
            // Arrange
            await page.click('nav a[href="/create"]')
            await page.waitForSelector('form[id="create"]')

            // Act
            await page.click('form[id="create"] input[type="submit"]')

            // Assert
            expect(page.url()).toBe(host + '/create')
        })

        test('create makes correct API call for logged in user', async () => {
            // Arrange
            await page.click('nav a[href="/create"]')
            await page.waitForSelector('form[id="create"]')

            // Act
            await page.locator('form[id="create"] input[id="title"]').fill(game.title)
            await page.locator('form[id="create"] input[id="category"]').fill(game.category)
            await page.locator('form[id="create"] input[id="maxLevel"]').fill(game.maxLevel)
            await page.locator('form[id="create"] input[id="imageUrl"]').fill(game.imageUrl)
            await page.locator('form[id="create"] textarea[id="summary"]').fill(game.summary)

            let [response] = await Promise.all([
                page.waitForResponse(response => response.url().includes('/data/games') && response.status() === 200),
                page.click('form[id="create"] input[type="submit"]')
            ])
            let gameData = await response.json()

            // Assert
            expect(response.ok()).toBeTruthy()
            expect(gameData.title).toEqual(game.title)
            expect(gameData.category).toEqual(game.category)
            expect(gameData.maxLevel).toEqual(game.maxLevel)
            expect(gameData.imageUrl).toEqual(game.imageUrl)
            expect(gameData.summary).toEqual(game.summary)
        })

        test('details show edit/delete buttons for owner', async () => {
            // Arrange
            await page.goto(host + '/catalog')

            // Act
            await page.click('.allGames .allGames-info:has-text("Random title") .details-button')

            // Assert
            await expect(page.locator('text="Delete"')).toBeVisible()
            await expect(page.locator('text="Edit"')).toBeVisible()
        })

        test('details does not show edit/delete buttons for non-owner', async () => {
            // Arrange
            await page.goto(host + '/catalog')

            // Act
            await page.click('.allGames .allGames-info:has-text("MineCraft") .details-button')

            // Assert
            await expect(page.locator('text="Delete"')).toBeHidden()
            await expect(page.locator('text="Edit"')).toBeHidden()
        })

        test('edit makes correct API call', async () => {
            // Arrange
            await page.goto(host + '/catalog')
            await page.click('.allGames .allGames-info:has-text("Random title") .details-button')
            await page.click('//a[text()="Edit"]')
            await page.waitForSelector('form[id="edit"]')

            // Act
            await page.locator('input[id="title"]').fill('Edited title')
            let [response] = await Promise.all([
                page.waitForResponse(response => response.url().includes('/data/games') && response.status() === 200),
                page.click('input[type="submit"]')
            ])
            let gameData = await response.json()

            // Assert
            expect(gameData.title).toEqual('Edited title')
            expect(gameData.category).toEqual(game.category)
            expect(gameData.maxLevel).toEqual(game.maxLevel)
            expect(gameData.imageUrl).toEqual(game.imageUrl)
            expect(gameData.summary).toEqual(game.summary)          
        })

        test('delete makes correct API call', async () => {
            // Arrange
            await page.goto(host + '/catalog')
            await page.click('.allGames .allGames-info:has-text("Edited title") .details-button')

            // Act
            let [response] = await Promise.all([
                page.waitForResponse(response => response.url().includes('/data/games') && response.status() === 200),
                page.click('//a[text()="Delete"]')
            ])

            // Assert
            expect(response.ok()).toBeTruthy()     
        })
    })

    describe('home page', () => {
        test('home page has correct data', async () => {
            // Act
            await page.goto(host)

            // Assert
            await expect(page.locator('//h2[text()="ALL new games are"]')).toHaveText('ALL new games are')
            //await expect(page.locator('.welcome-message h2')).toHaveText('ALL new games are')
            await expect(page.locator('//h3[text()="Only in GamesPlay"]')).toHaveText('Only in GamesPlay')
            //await expect(page.locator('.welcome-message h3')).toHaveText('Only in GamesPlay')
            await expect(page.locator('#home-page h1')).toHaveText('Latest Games')
            //await expect(page.locator('//div[@id="home-page"]//h1[text()="Latest Games"]')).toHaveText('Latest Games')

            const games = await page.locator('#home-page .game').all()
            expect(games.length).toBeGreaterThanOrEqual(3)
        })
    })
})