import React from 'react'
import '../styles/Search.css'

interface SearchProps {
    query: string
    setQuery: (query: string) => void
    setCurrentPage: (page: number) => void
}

const Search: React.FC<SearchProps> = ({ query, setQuery, setCurrentPage }) => {
    return (
        <div className="search-container">
            <form className="search-form" role="search">
                <h2 className="search-form-title">Search Products</h2>
                <div className="search-form-group">
                    <input
                        type="text"
                        id="search-query"
                        value={query}
                        onChange={(e) => {
                            e.preventDefault()
                            setQuery(e.target.value)
                            setCurrentPage(1)
                            console.log(e.target.value)
                        }}
                        placeholder="Enter product name..."
                        required
                    />
                </div>
            </form>
        </div>
    )
}

export default Search
