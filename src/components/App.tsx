import React, { useState, useEffect } from 'react'
import ProductList from './ProductList'
import ProductForm from './ProductForm'
import Search from './Search'
import StatusBanner from './StatusBanner'
import { fetchProducts } from '../pages/api/api'
import '../styles/Icon.css'
import '../styles/App.css'
import type { Product } from '../utils/types'

function App() {
    const [products, setProducts] = useState<Product[]>([])
    const [status, setStatus] = useState('')
    const [query, setQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [showForm, setShowForm] = useState<'none' | 'add' | 'delete'>('none')

    const loadProducts = async (query = '') => {
        try {
            const response = await fetchProducts(query)
            setProducts(response.products)
            setTotalPages(response.totalPages)
        } catch (error) {
            console.error('Error fetching products:', error)
            setStatus('Failed to load products')
        }
    }
    useEffect(() => {
        
        loadProducts()
    }, [])

    useEffect(() => {
        loadProducts(query)
    }, [query])

    return (
        <div>
            <header>
                <div className="header-divider">
                    <a
                        className="header-link"
                        href="#"
                        onClick={(e) => {
                            e.preventDefault()
                            setShowForm(showForm === 'add' ? 'none' : 'add')
                        }}
                    >
                        <img
                            src="/add.svg"
                            alt="Add Product"
                            className="icon"
                        />
                    </a>
                    <span className="tooltip">Add Product</span>
                </div>
                <div className="header-divider">
                    <a href="/dashboard" className="header-link">
                        <img src="/home.svg" alt="Home" className="icon" />
                    </a>
                    <span className="tooltip">Home</span>
                </div>
                <h1 className="app-title">Urban Cart</h1>
                <title>Urban Cart</title>
                <div className="header-links"></div>
                <div className="header-divider">
                    <a
                        className="header-link"
                        href="#"
                        onClick={(e) => {
                            e.preventDefault()
                            setShowForm(
                                showForm === 'delete' ? 'none' : 'delete'
                            )
                        }}
                    >
                        <img
                            src="/delete.svg"
                            alt="Delete Product"
                            className="icon"
                        />
                    </a>
                    
                    <span className="tooltip">Delete Product</span>
                </div>
                <form action="/api/auth/signout" className="header-divider">
                    <button id="logout" type="submit" className="header-link">
                        <img src="/logout.svg" alt="Logout" className="icon" />
                    </button>
                    <span className="tooltip">Sign Out</span>
                </form>
            </header>
            {status && (
                <StatusBanner message={status} onClose={() => setStatus('')} />
            )}
            {showForm === 'add' && (
                <ProductForm
                    mode="add"
                    onProductAdded={() => {
                        setStatus('Product added successfully')
                        setShowForm('none')
                        loadProducts()
                        setCurrentPage(1)
                    }}
                />
            )}
            {showForm === 'delete' && (
                <ProductForm
                    mode="delete"
                    onProductDeleted={() => {
                        setStatus('Product deleted successfully')
                        setShowForm('none')
                        loadProducts()
                        setCurrentPage(1)
                    }}
                />
            )}
            {showForm === 'none' && (
                <>
                    {/* {" "} */}
                    <Search
                        query={query}
                        setQuery={setQuery}
                        setCurrentPage={setCurrentPage}
                    />
                    <ProductList
                        products={products}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        setCurrentPage={setCurrentPage}
                    />
                </>
            )}
        </div>
    )
}

export default App
