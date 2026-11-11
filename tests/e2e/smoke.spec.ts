import { expect, test } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
] as const;

test.describe('SETARA Barbershop — E2E Smoke & Responsiveness', () => {
  test('halaman publik tampil dengan jadwal operasional resmi', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /SETARA Barbershop/i })).toBeVisible();
    await expect(page.getByText('Senin').first()).toBeVisible();
    await expect(page.getByText('Tutup').first()).toBeVisible();
    await expect(page.getByText('13:00 – 21:00').first()).toBeVisible();

    await page.goto('/services');
    await expect(page.getByRole('heading', { name: /Daftar Layanan/i })).toBeVisible();

    await page.goto('/about');
    await expect(page.getByRole('heading', { name: /SETARA Barbershop/i })).toBeVisible();

    await page.goto('/contact');
    await expect(page.getByRole('heading', { name: /Lokasi & Kontak/i })).toBeVisible();

    await page.goto('/booking');
    await expect(page.getByRole('heading', { name: /Pilih Layanan/i })).toBeVisible();
  });

  test('proteksi route /admin/* me-redirect ke /login tanpa sesi (AC-05)', async ({
    page,
  }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /Login Admin/i })).toBeVisible();

    await page.goto('/admin/bookings');
    await expect(page).toHaveURL(/\/login/);
  });

  for (const vp of VIEWPORTS) {
    test(`tidak ada horizontal scroll pada viewport ${vp.name} (AC-07)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const route of ['/', '/booking', '/check-booking', '/login']) {
        await page.goto(route);
        const overflow = await page.evaluate(() => {
          return (
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth
          );
        });
        expect(overflow, `Overflow horizontal terdeteksi di ${route} (${vp.name})`).toBe(
          false
        );
      }
    });
  }
});

