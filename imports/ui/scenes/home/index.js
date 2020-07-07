import React, { Component } from 'react';
import MetaTags from 'react-meta-tags';
import { Meteor } from 'meteor/meteor';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import {
  Container, Button, Carousel, CarouselItem, CarouselControl, CarouselIndicators,
  Badge,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRocket, faHandsHelping, faShoppingBag } from '@fortawesome/free-solid-svg-icons';
import ProjectCard from '../../components/projectCard';

function parseDate(str) {
  const mdy = str.split('-');
  return new Date(mdy[2], mdy[0] - 1, mdy[1]);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function datediff(first, second) {
  return Math.round((second - first) / (1000 * 60 * 60 * 24));
}

export default class Home extends Component {
    state = {
      activeIndex: 0,
      projects: null,
      products: null,
      carouselItems: null,
    };

    componentDidMount() {
      Meteor.call('getProjects', { limit: 3, skip: 0 }, (error, result) => {
        this.setState({ carouselItems: result });
      });

      Meteor.call('getProjects', { limit: 6, skip: 0 }, (error, result) => {
        this.setState({ projects: result });
      });

      Meteor.call('getProducts', { limit: 3, skip: 0, filter: null }, (error, result) => {
        this.setState({ products: result });
      });
    }

    onExiting = () => {
      this.animating = true;
    }

    onExited = () => {
      this.animating = false;
    }

    next = () => {
      const { activeIndex, carouselItems } = this.state;

      if (this.animating) return;
      const nextIndex = activeIndex === carouselItems.length - 1 ? 0 : activeIndex + 1;
      this.setState({ activeIndex: nextIndex });
    }

    previous = () => {
      const { activeIndex, carouselItems } = this.state;

      if (this.animating) return;
      const nextIndex = activeIndex === 0 ? carouselItems.length - 1 : activeIndex - 1;
      this.setState({ activeIndex: nextIndex });
    }

    goToIndex = (newIndex) => {
      if (this.animating) return;
      this.setState({ activeIndex: newIndex });
    }

    render() {
      const {
        activeIndex, carouselItems, projects, products,
      } = this.state;

      const slides = carouselItems && carouselItems.map(item => (
        <CarouselItem
          onExiting={this.onExiting}
          onExited={this.onExited}
          key={`carousel-${item._id}`}
        >
          <img src={item.imgHeader} alt={item.name} />
          <div className="carousel-caption d-none d-md-block">
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <Link className="btn btn-primary" to={`/projet/${item.url}`}>Contribuer ›</Link>
          </div>
        </CarouselItem>
      ));

      const Product = ({ data }) => (
        <div className="col-md-4">
          <div className="card mb-4">
            <Link to={`/produit/${data.url}`}><img className="card-img-top" src={data.img} alt={data.name} /></Link>
            <div className="card-body">
              <h5 className="card-title" style={{ minHeight: '74px' }}>
                {data.name}
                <br /><Badge color="primary">{data.price + data.transportCosts}€</Badge>
                <br /><small>De <Link to={`/magasin/${data.creator._id}`}>{ data.creator.profile.companyName ? data.creator.profile.companyName : `${data.creator.profile.name} ${data.creator.profile.familyName}` }</Link></small>
              </h5>
              <p className="card-text" style={{ height: '96px' }}>{data.description}</p>

              <Link to={`/produit/${data.url}`} className="btn btn-block btn-primary">Voir</Link>
            </div>
          </div>
        </div>
      );

      return (
        <React.Fragment>
          <MetaTags>
            <title>Onvataider.com - crowdfunding solidaire, financement participatif populaire</title>
            <meta name="description" content="Onvataider.com - Crowdfunding pour des projets participatifs sociaux et solidaires pour le handicap, les actions collectives et les collectes solidaires" />
            <meta property="og:title" content="Onvataider.com - crowdfunding solidaire, financement participatif populaire" />
            <meta property="og:image" content="`https://onvataider.com/banner.jpg" />
          </MetaTags>

          <div id="main-content-exact">
            {slides
          && (
            <CarouselWrapper
              activeIndex={activeIndex}
              next={this.next}
              previous={this.previous}
            >
              <CarouselIndicators items={carouselItems} activeIndex={activeIndex} onClickHandler={this.goToIndex} />
                {slides}
              <CarouselControl direction="prev" directionText="Previous" onClickHandler={this.previous} />
              <CarouselControl direction="next" directionText="Next" onClickHandler={this.next} />
            </CarouselWrapper>
          )}
          </div>

          <div style={{
            backgroundColor: '#9adaef', paddingTop: '40px', paddingBottom: '40px', marginBottom: '4rem',
          }}
          >
            <Container style={{ textAlign: 'center' }}>
              <h1 style={{
                fontFamily: 'Dekko, cursive', fontSize: '2.0rem', color: 'white',
              }}
              >Financement participatif pour des projets d'actions collectives et le Handicap <br /> & <br /> Ventes solidaires au profit des cagnottes.
              </h1>
            </Container>
          </div>

          <div>
            <Container>
              <div className="row">
                <div className="col-md-12 row">
                  <h2
                    className="col-md-12"
                    style={{
                      fontSize: '1.38462rem', fontWeight: 500, lineHeight: '1.5', paddingLeft: '15px',
                    }}
                  >
                  Projets à la une
                  </h2>
                  {projects && projects.map((project) => {
                    const percentage = (project.currentMoney / project.goal) * 100;
                    const myDate = new Date();
                    let remainingTime = datediff(parseDate(`${myDate.getMonth() + 1}-${myDate.getDate() + 1}-${myDate.getFullYear()}`), addDays(new Date(project.startDate), project.endDate));
                    if (remainingTime < 0) remainingTime = 0;

                    return (
                      <ProjectCard
                        key={project._id}
                        name={project.name}
                        link={project.url}
                        thumbnail={project.imgThumbnail}
                        description={project.description}
                        percentage={percentage}
                        paymentsCount={project.numberDonations}
                        cooldown={remainingTime}
                        creatorName={project.creator.profile.companyName ? `${project.creator.profile.companyName}`
                          : `${project.creator.profile.name} ${project.creator.profile.familyName}`}
                        type={project.type}
                        hideMoney={project.hideMoney}
                      />
                    );
                  })}

                  <div className="col-md-12 text-center">
                    <Link to="/projets-collectes"><Button color="primary">En voir plus</Button></Link>
                  </div>

                  <img style={{ width: '100%', marginTop: '40px' }} alt="Ventes solidaires au profit des cagnottes" src="/banner.jpg" />

                  <h2
                    className="col-md-12"
                    style={{
                      fontSize: '1.38462rem', fontWeight: 500, lineHeight: '1.5', paddingLeft: '15px', marginTop: '32px',
                    }}
                  >
                  Ventes solidaires
                  </h2>

                  {products && products.map(product => <Product key={product._id} data={product} />)}

                  <div className="col-md-12 text-center" style={{ marginTop: '1.5rem' }}>
                    <Link to="/produits"><Button color="primary">En voir plus</Button></Link>
                  </div>
                </div>
              </div>
            </Container>
          </div>

          <div style={{
            backgroundColor: '#ecf0f1',
            backgroundImage: 'url(/background.jpg)',
            backgroundRepeat: ' no-repeat',
            backgroundSize: 'cover',
            marginTop: '64px',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            color: 'white',
            position: 'relative',
          }}
          >
            <div style={{
              backgroundColor: 'black',
              opacity: '0.4',
              left: 0,
              bottom: 0,
              top: 0,
              right: 0,
              position: 'absolute',
            }}
            />
            <Container style={{ paddingTop: '40px', paddingBottom: '64px' }}>
              <div className="col-md-12 row">
                <h2 className="col-md-12" style={{ textAlign: 'center', marginBottom: '46px' }}>Comment ça marche ?</h2>

                <Link to="/deposerunprojet" className="col-md-4" style={{ textAlign: 'center', color: 'white' }}>
                  <FontAwesomeIcon icon={faRocket} size="6x" />
                  <h3 style={{ fontSize: '1.50rem' }}>Déposer un projet ›</h3>
                </Link>

                <Link to="/creerunecollectesolidaire" className="col-md-4" style={{ textAlign: 'center', color: 'white' }}>
                  <FontAwesomeIcon icon={faHandsHelping} size="6x" />
                  <h3 style={{ fontSize: '1.50rem' }}>Créer une collecte solidaire ›</h3>
                </Link>

                <Link to="/devenirvendeur" className="col-md-4" style={{ textAlign: 'center', color: 'white' }}>
                  <FontAwesomeIcon icon={faShoppingBag} size="6x" />
                  <h3 style={{ fontSize: '1.50rem' }}>Devenir Vendeur solidaire ›</h3>
                </Link>
              </div>
            </Container>
          </div>
        </React.Fragment>
      );
    }
}

const CarouselWrapper = styled(Carousel)`  
  /* Since positioning the image, we need to help out the caption */
  .carousel-caption {
    bottom: 3rem;
    z-index: 10;
    
    h3, p {
      text-shadow: 2px 2px 4px #000000;
    }
  }
  
  /* Declare heights because of positioning of img element */
  .carousel-item {
    height: 32rem;
    background-color: #777;
  }
  .carousel-item > img {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    min-width: 100%;
  }

  @media (min-width: 40em) {
    /* Bump up size of carousel content */
    .carousel-caption p {
        margin-bottom: 1.25rem;
        font-size: 1.25rem;
        line-height: 1.4;
    }
  }
`;
