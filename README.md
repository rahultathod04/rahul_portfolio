# Rahul's Portfolio (Data Science + DSA)

A clean, fast, static portfolio you can deploy on GitHub Pages or Netlify. Content is driven by JSON files so you can add/update items without touching HTML.

## How to use

1. **Edit your content** in `/data/`:
   - `projects.json`: add new projects.
   - `skills.json`: update your skill buckets.
   - `leetcode.json`: update your DSA stats and links.
2. **Replace assets**:
   - `assets/avatar.png` with your photo (square recommended).
   - `assets/Rahul_Tathod_Resume.pdf` with your resume file.
3. **Open `index.html`** locally to preview. Deploy with GitHub Pages or Netlify.

## LeetCode hover card

For privacy and reliability, the hover card reads from `data/leetcode.json` (static). If you prefer live stats, you can swap the card body with a third‑party image card or your own endpoint. This template avoids external dependencies by default.

## Project kinds

Use one of: `data`, `ml`, `algo`, `viz`. The filter buttons will show/hide by kind.

## Theming

Click the moon button (top‑right) to toggle dark/light. The preference is stored in `localStorage`.

---

Built with semantic HTML, accessible ARIA attributes, and responsive CSS.
