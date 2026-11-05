import { UNIVERSITIES } from '../../data/universities.js'
import './coworkings.css'

export default function AppHeader({ universityId, onUniversityChange }) {
  return (
    <header className="app-header">
      <h1 className="app-header__title">УрФУ.Коворкинги</h1>
      <select
        className="app-header__university"
        aria-label="Выберите вуз"
        value={universityId}
        onChange={(event) => onUniversityChange(event.target.value)}
      >
        {UNIVERSITIES.map((university) => (
          <option key={university.id} value={university.id}>
            {university.name}
          </option>
        ))}
      </select>
    </header>
  )
}
