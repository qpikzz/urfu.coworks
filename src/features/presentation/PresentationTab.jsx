import { useRef, useState } from 'react'
import { PRESENTATION_SLIDES } from '../../data/slides.js'
import '../../styles/presentation.css'

const AUTHOR_URL = 'https://github.com/qpikzz'
const SWIPE_THRESHOLD = 48

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
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef(null)
  const isFirst = currentSlide === 0
  const isLast = currentSlide === PRESENTATION_SLIDES.length - 1

  function goToSlide(index) {
    setCurrentSlide(Math.max(0, Math.min(PRESENTATION_SLIDES.length - 1, index)))
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

  function handlePointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return

    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      pointerId: event.pointerId,
      axis: null,
    }
  }

  function handlePointerMove(event) {
    const drag = dragRef.current

    if (!drag || event.pointerId !== drag.pointerId) return

    const deltaX = event.clientX - drag.startX
    const deltaY = event.clientY - drag.startY

    if (!drag.axis) {
      if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) return

      drag.axis = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y'

      if (drag.axis === 'y') {
        dragRef.current = null
        return
      }

      setIsDragging(true)
      event.currentTarget.setPointerCapture?.(event.pointerId)
    }

    if (drag.axis !== 'x') return

    const isPullingStart = isFirst && deltaX > 0
    const isPullingEnd = isLast && deltaX < 0
    setDragOffset(isPullingStart || isPullingEnd ? deltaX * 0.35 : deltaX)
  }

  function handlePointerEnd(event) {
    const drag = dragRef.current

    if (!drag || event.pointerId !== drag.pointerId) return

    dragRef.current = null
    setIsDragging(false)
    setDragOffset(0)

    const deltaX = event.clientX - drag.startX
    const deltaY = event.clientY - drag.startY

    if (
      drag.axis !== 'x' ||
      Math.abs(deltaX) < SWIPE_THRESHOLD ||
      Math.abs(deltaX) <= Math.abs(deltaY)
    ) {
      return
    }

    if (deltaX < 0) {
      goNext()
    } else {
      goPrev()
    }
  }

  function handlePointerCancel() {
    dragRef.current = null
    setIsDragging(false)
    setDragOffset(0)
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

          <div
            className={`slider__viewport${isDragging ? ' slider__viewport--dragging' : ''}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerCancel}
          >
            <div
              className={`slider__track${isDragging ? ' slider__track--dragging' : ''}`}
              style={{
                transform: `translate3d(calc(${-currentSlide * 100}% + ${dragOffset}px), 0, 0)`,
              }}
            >
              {PRESENTATION_SLIDES.map((slide, index) => (
                <article
                  className={`slider__slide${index === currentSlide ? ' slider__slide--active' : ''}`}
                  key={slide.id}
                  aria-hidden={index !== currentSlide}
                >
                  <p className="slider__counter">
                    Слайд {index + 1} из {PRESENTATION_SLIDES.length}
                  </p>
                  <h2 className="slider__title">{slide.title}</h2>
                  <p className="slider__text">{slide.text}</p>
                </article>
              ))}
            </div>
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

        <p className="slider__author">
          <a href={AUTHOR_URL} target="_blank" rel="noopener noreferrer">
            By Nikita Shvedov
          </a>
        </p>
      </div>
    </section>
  )
}
