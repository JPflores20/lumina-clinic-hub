

# Lumina OptiSaaS — Admin Panel

## Design System
- **Font**: Inter (already available) with sharp, corporate weights
- **Colors**: Slate-50 bg, Teal-950 sidebar, Cyan-600/Teal-500 primary accent, Amber/Emerald/Rose for status colors
- **Cards**: White, rounded-2xl, shadow-sm with hover:shadow-md transitions
- **Animations**: transition-all duration-300 on interactive elements

## Layout Structure
- **Sidebar** (desktop): Fixed left, teal-950 bg, nav items with icons (Dashboard, POS Sales, Patients, Eye Exam, Inventory, Orders, Settings), active state with teal-800 bg + cyan-400 left border
- **Topbar**: White backdrop-blur, global search bar, notification bell with red badge ("3"), user avatar chip ("Admin")
- **Bottom Nav** (mobile only): Home, POS, Patients, Menu icons
- **React state-based navigation** to switch between views

## View 1: Dashboard
- **Greeting banner**: teal-50→cyan-100 gradient, "Good morning!" + current date
- **4 KPI cards** (responsive grid 4→2→1): Sales Today, Monthly Revenue, Appointments Today, Pending Orders — each with icon, large number, trend indicator
- **Quick Actions grid**: 6 square buttons (New Sale, New Quote, New Order, Schedule Appointment, New Patient, Eye Exam)
- **Two side-by-side panels**: Activity History list + Smart Alerts card

## View 2: POS (Point of Sale)
- **Left 2/3**: Product search input + card grid catalog with frame/lens items (name, stock badge, price). Click adds to cart
- **Right 1/3**: Shopping cart panel — item list with +/- quantity, subtotal, 16% tax, large total, payment method selector (Cash/Card), emerald "Charge" button

## Tech
- All icons from lucide-react
- shadcn/ui components for buttons, inputs, badges, cards
- Fully responsive Tailwind layout
- Subtle hover/transition animations throughout

