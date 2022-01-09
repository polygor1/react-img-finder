import React, { Component } from 'react';
import PropTypes from 'prop-types';
import pixabayAPI from 'services/pixabay-api';
import ImageGalleryItem from './ImageGalleryItem';
import Loader from 'components/Loader';
import ErrorSearch from 'components/ErrorSearch';
import Button from 'components/Button';
import Modal from 'components/Modal';
import styles from './ImageGallery.module.css';

export default class ImageGallery extends Component {
  static propTypes = {
    searchQuery: PropTypes.string,
  };

  state = {
    images: [],
    page: 1,
    error: null,
    showModal: false,
    modalImgProps: { url: '', alt: '' },
    status: 'idle',
  };

  async componentDidUpdate(prevProps) {
    const prevQuery = prevProps.searchQuery;
    const nextQuery = this.props.searchQuery;

    if (prevQuery !== nextQuery) {
      await this.reset(); // ага, щас!
      this.setState({ status: 'pending' });
      this.fetchImages(nextQuery);
    }
  }

  fetchImages = nextQuery => {
    const { page } = this.state;
    pixabayAPI
      .fetchImg(nextQuery, page)
      .then(({ hits }) => {
        if (hits.length === 0) {
          // если ничего не пришло в ответе
          return Promise.reject(new Error('Sorry! Nothing found'));
        }
        // если удалось что-то получить
        this.setState(prevState => ({
          images: [...prevState.images, ...hits],
          status: 'resolved',
        }));
      })
      // если все плохо
      .catch(error => this.setState({ error, status: 'rejected' }));
  };

  incrementPage = () => {
    this.setState(prevState => ({ page: prevState.page + 1 }));
  };

  reset = () => {
    this.setState({ page: 1, images: [] });
  };

  scrollDown = () => {
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        left: 0,
        behavior: 'smooth',
      });
    }, 1000);
  };

  handleLoadBtnClick = async () => {
    const nextQuery = this.props.searchQuery;
    await this.incrementPage();
    this.fetchImages(nextQuery);
    this.scrollDown();
  };

  toggleModal = () => {
    this.setState(({ showModal }) => ({ showModal: !showModal }));
  };

  handleImgClick = props => {
    this.setState({ modalImgProps: props });
    this.toggleModal();
  };

  render() {
    const { images, error, status, showModal } = this.state;
    const { url, alt } = this.state.modalImgProps;

    if (status === 'idle') {
      return <div></div>;
    }

    if (status === 'pending') {
      return <Loader />;
    }

    if (status === 'rejected') {
      return <ErrorSearch message={error.message} />;
    }
    if (status === 'resolved') {
      return (
        <>
          {showModal && (
            <Modal onClose={this.toggleModal}>
              <img src={url} alt={alt} className={styles.ModalImg} />
            </Modal>
          )}
          <ul className={styles.ImageGallery}>
            {images.map(({ id, webformatURL, tags, largeImageURL }) => (
              <ImageGalleryItem
                key={id}
                src={webformatURL}
                url={largeImageURL}
                alt={tags}
                openModal={this.handleImgClick}
              />
            ))}
          </ul>
          <Button handleLoadMore={this.handleLoadBtnClick} />
        </>
      );
    }
  }
}
