function FilterTags({ tags, activeTag, onTagClick }) {
  return (
    <div className="filter-tags">
      {tags.map(tag => (
        <button
          key={tag}
          className={`filter-tag ${activeTag === tag ? 'active' : ''}`}
          onClick={() => onTagClick(tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

export default FilterTags;
