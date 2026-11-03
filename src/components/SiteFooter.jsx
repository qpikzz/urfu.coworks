const AUTHOR_URL = 'https://github.com/qpikzz'

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>
        design &amp; idea by{' '}
        <a href={AUTHOR_URL} target="_blank" rel="noopener noreferrer">
          Nikita Shvedov
        </a>
      </p>
    </footer>
  )
}
