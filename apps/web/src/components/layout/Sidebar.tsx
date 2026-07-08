export function Sidebar() {
  return (
    <aside className="history-sidebar">
      <a className="history-sidebar__brand" href="/upload">
        DataShare
      </a>
      <nav className="history-sidebar__nav" aria-label="Navigation espace utilisateur">
        <a className="history-sidebar__item" href="/history">
          Mes fichiers
        </a>
      </nav>
    </aside>
  );
}
