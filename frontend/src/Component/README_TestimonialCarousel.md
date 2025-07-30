# Testimonial Carousel Component

A modern, responsive testimonial carousel component with smooth animations and beautiful design.

## Features

- ✅ **Auto-play functionality** with customizable interval
- ✅ **Smooth slide transitions** with cubic-bezier easing
- ✅ **Responsive design** that works on all devices
- ✅ **Navigation arrows** and dot indicators
- ✅ **Star ratings** display
- ✅ **Author information** with profile images
- ✅ **Course badges** for each testimonial
- ✅ **Statistics section** with hover effects
- ✅ **Accessibility features** (ARIA labels, keyboard navigation)
- ✅ **High contrast mode** support
- ✅ **Reduced motion** support for users with motion sensitivity

## Usage

### Basic Usage (with default testimonials)

```jsx
import TestimonialCarousel from './Component/TestimonialCarousel';

function MyPage() {
  return (
    <div>
      <TestimonialCarousel />
    </div>
  );
}
```

### Advanced Usage (with custom testimonials)

```jsx
import TestimonialCarousel from './Component/TestimonialCarousel';

function MyPage() {
  const customTestimonials = [
    {
      id: 1,
      name: "John Doe",
      role: "Web Developer",
      company: "TechCorp",
      image: "https://example.com/john.jpg",
      rating: 5,
      text: "Amazing course! I learned so much and got a great job.",
      course: "Full Stack Development"
    },
    // ... more testimonials
  ];

  return (
    <div>
      <TestimonialCarousel 
        testimonials={customTestimonials}
        autoPlay={true}
        interval={5000}
      />
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `testimonials` | Array | `[]` | Array of testimonial objects (see structure below) |
| `autoPlay` | Boolean | `true` | Whether to auto-play the carousel |
| `interval` | Number | `5000` | Auto-play interval in milliseconds |

## Testimonial Object Structure

```javascript
{
  id: Number,           // Unique identifier
  name: String,         // Author's name
  role: String,         // Author's job title
  company: String,      // Author's company
  image: String,        // Profile image URL
  rating: Number,       // Star rating (1-5)
  text: String,         // Testimonial text
  course: String        // Course name for badge
}
```

## Default Testimonials

If no testimonials are provided, the component will use these default testimonials:

1. **Sarah Johnson** - Web Developer at TechCorp
2. **Michael Chen** - Data Scientist at DataFlow Inc
3. **Emily Rodriguez** - Digital Marketing Manager at GrowthFirst
4. **David Thompson** - UI/UX Designer at DesignStudio
5. **Lisa Wang** - Software Engineer at InnovateTech

## Styling

The component includes comprehensive CSS with:

- **Gradient backgrounds** with subtle patterns
- **Smooth animations** and transitions
- **Responsive breakpoints** for mobile, tablet, and desktop
- **Hover effects** on interactive elements
- **Glass morphism** effects on stats cards
- **Accessibility features** for better user experience

## Customization

### Changing Colors

You can customize the colors by modifying the CSS variables in `TestimonialCarousel.css`:

```css
.testimonial-carousel-container {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}
```

### Changing Animation Speed

Modify the transition duration in the CSS:

```css
.testimonial-card {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Disabling Auto-play

```jsx
<TestimonialCarousel autoPlay={false} />
```

### Custom Interval

```jsx
<TestimonialCarousel interval={3000} /> // 3 seconds
```

## Integration Examples

### In Homepage

```jsx
// In your homepage component
import TestimonialCarousel from '../Component/TestimonialCarousel';

// Add this section to your homepage
<section className="testimonials-section">
  <TestimonialCarousel />
</section>
```

### In About Page

```jsx
// In your about page
import TestimonialCarousel from '../Component/TestimonialCarousel';

// Add this section to your about page
<section className="student-stories">
  <div className="container">
    <h2>What Our Students Say</h2>
    <TestimonialCarousel />
  </div>
</section>
```

### In Course Details Page

```jsx
// In your course details page
import TestimonialCarousel from '../Component/TestimonialCarousel';

// Filter testimonials for specific course
const courseTestimonials = allTestimonials.filter(
  t => t.course === "Full Stack Development"
);

<TestimonialCarousel testimonials={courseTestimonials} />
```

## Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers

## Dependencies

- React 16.8+ (for hooks)
- Font Awesome (for icons)
- Bootstrap (for grid system and utilities)

## Performance

- **Lazy loading** for images
- **Optimized animations** using CSS transforms
- **Memory efficient** with proper cleanup
- **Smooth 60fps** animations

## Accessibility

- **ARIA labels** for screen readers
- **Keyboard navigation** support
- **Focus management** for interactive elements
- **High contrast mode** support
- **Reduced motion** support

## Troubleshooting

### Images not loading
Make sure the image URLs are accessible and the images exist. The component includes fallback placeholder images.

### Carousel not working
Check that Font Awesome is properly loaded for the icons.

### Styling issues
Ensure the CSS file is imported and there are no conflicting styles.

## License

This component is part of the Focalyt React application. 