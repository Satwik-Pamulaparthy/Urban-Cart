import React, { useState } from 'react'
import { addProduct, deleteProduct } from '../pages/api/api'
import '../styles/ProductForm.css'

interface ProductFormProps {
    mode: 'add' | 'delete'
    onProductAdded?: () => void
    onProductDeleted?: () => void
}
const ProductForm: React.FC<ProductFormProps> = ({
    mode,
    onProductAdded,
    onProductDeleted,
}) => {
    const [name, setName] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [productId, setProductId] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (mode === 'add') {
                await addProduct({
                    name,
                    image_url: imageUrl,
                    deleted: false,
                })
                setName('')
                setImageUrl('')
                onProductAdded?.()
            } else {
                await deleteProduct(Number(productId))
                setProductId('')
                onProductDeleted?.()
            }
        } catch (error) {
            console.error(
                `Error ${mode === 'add' ? 'adding' : 'deleting'} product:`,
                error
            )
        }
    }

    return (
        <div className="product-form-container">
            <h2 className="product-form-title">
                {mode === 'add' ? 'Add New Product' : 'Delete Product'}
            </h2>
            <form onSubmit={handleSubmit} className="product-form">
                {mode === 'add' ? (
                    <>
                        <div className="form-group">
                            <label htmlFor="name"></label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                placeholder="Enter product name..."
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="imageUrl"></label>
                            <input
                                type="url"
                                id="imageUrl"
                                value={imageUrl}
                                placeholder="Enter image URL..."
                                onChange={(e) => setImageUrl(e.target.value)}
                            />
                        </div>
                    </>
                ) : (
                    <div className="form-group">
                        <label htmlFor="productId"></label>
                        <input
                            type="text"
                            id="productId"
                            value={productId}
                            placeholder="Enter product ID..."
                            onChange={(e) => setProductId(e.target.value)}
                            required
                        />
                    </div>
                )}
                <button
                    type="submit"
                    id="submitButton"
                    className={
                        mode === 'add' ? 'submit-button' : 'delete-button'
                    }
                >
                    {mode === 'add' ? 'Add Product' : 'Delete Product'}
                </button>
            </form>
        </div>
    )
}

export default ProductForm
