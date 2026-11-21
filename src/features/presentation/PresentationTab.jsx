import { useEffect, useRef, useState } from 'react'
import presentationHtml from '../../assets/presentation.html?raw'
import '../../styles/presentation.css'

function ArrowIcon({ direction }) {
  return (
    <svg
      className="slider__arrow-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={direction === 'prev' ? 'M14.5 5.5 8 12l6.5 6.5' : 'M9.5 5.5 16 12l-6.5 6.5'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function PresentationTab({ hidden }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [totalSlides, setTotalSlides] = useState(0)
  const frameRef = useRef(null)
  const isFirst = totalSlides === 0 || currentSlide <= 0
  const isLast = totalSlides === 0 || currentSlide >= totalSlides - 1

  useEffect(() => {
    function handleMessage(event) {
      if (!frameRef.current || event.source !== frameRef.current.contentWindow) {
        return
      }

      const data = event.data

      if (!data || data.type !== 'cowork-slides:state') return

      if (Number.isInteger(data.index)) setCurrentSlide(data.index)
      if (Number.isInteger(data.total)) setTotalSlides(data.total)
    }

    window.addEventListener('message', handleMessage)

    return () => window.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    if (hidden) return undefined

    const frameId = requestAnimationFrame(() => {
      frameRef.current?.contentWindow?.dispatchEvent(new Event('resize'))
    })

    return () => cancelAnimationFrame(frameId)
  }, [hidden])

  function goToSlide(index) {
    frameRef.current?.contentWindow?.postMessage(
      { type: 'cowork-slides:go', index },
      '*',
    )
  }

  function goPrev() {
    if (!isFirst) goToSlide(currentSlide - 1)
  }

  function goNext() {
    if (!isLast) goToSlide(currentSlide + 1)
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      goPrev()
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      goNext()
    }
  }

  return (
    <section
      id="panel-presentation"
      className="tab-panel tab-panel--presentation presentation"
      aria-labelledby="tab-presentation"
      hidden={hidden}
    >
      <div
        className="slider"
        role="region"
        aria-roledescription="карусель"
        aria-label="Презентация проекта"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div className="slider__frame">
          <button
            className="slider__arrow slider__arrow--prev"
            type="button"
            aria-label="Предыдущий слайд"
            disabled={isFirst}
            onClick={goPrev}
          >
            <ArrowIcon direction="prev" />
          </button>

          <div className="slider__viewport">
            <iframe
              ref={frameRef}
              className="slider__embed"
              title="Презентация проекта"
              srcDoc={presentationHtml}
            />
          </div>

          <button
            className="slider__arrow slider__arrow--next"
            type="button"
            aria-label="Следующий слайд"
            disabled={isLast}
            onClick={goNext}
          >
            <ArrowIcon direction="next" />
          </button>
        </div>
      </div>
    </section>
  )
}
