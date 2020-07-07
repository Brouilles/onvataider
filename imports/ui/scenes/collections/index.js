import React, { Component } from 'react';
import MetaTags from 'react-meta-tags';
import { Link } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import {
  Container, Button, ButtonGroup, ButtonToolbar,
} from 'reactstrap';
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

export default class Projects extends Component {
    state = {
      search: null,
      page: 0,
      numberOfPage: 0,
      projects: null,
      categories: null,
      categoryUrl: null,
    };

    componentDidMount() {
      this.setState({ categoryUrl: this.props.match.params.category }, this.updateData);

      // Categories
      Meteor.call('getCategories', (error, result) => {
        this.setState({ categories: result });
      });
    }

    componentWillReceiveProps(newProps) {
      this.setState({
        categoryUrl: newProps.match.params.category,
        page: 0,
      }, this.updateData);
    }

    searchChange = () => {
      this.setState({ search: this.searchInput.value }, this.updateData);
    }

    changePage = (number) => {
      this.setState({ page: number }, this.updateData);
    }

    updateData = () => {
      const { page, categoryUrl, search } = this.state;

      Meteor.call('getProjects',
        {
          limit: 6,
          type: 2,
          skip: page * 6,
          filter: search,
          categoryUrl,
        }, (error, result) => {
          this.setState({ projects: result });
        },
      );

      Meteor.call('projectCount',
        {
          filter: search,
          type: 2,
          categoryUrl,
        }, (error, result) => {
          const tempArray = [];
          for (let i = 0; i < result; i += 6) { tempArray.push(i / 6); }

          this.setState({ numberOfPage: tempArray });
        },
      );
    }

    render() {
      const { categories, projects, numberOfPage } = this.state;

      return (
        <div id="main-content">
          <Container>
            <MetaTags>
              <title>Collectes Solidaires - Onvataider.com</title>
              <meta name="description" content="Onvataider.com - Crowdfunding pour des projets participatifs sociaux et solidaires pour le handicap, les actions collectives et les collectes solidaires" />
              <meta property="og:title" content="Collectes Solidaires - Onvataider.com" />
              <meta property="og:image" content="`https://onvataider.com/banner.jpg" />
            </MetaTags>

            <div className="row">
              <div className="form-group col-md-12">
                <input ref={(input) => { this.searchInput = input; }} onChange={this.searchChange} style={{ marginBottom: '6px' }} type="text" className="form-control" placeholder="Rechercher" />
                <span style={{ marginRight: '6px' }}>Trier par:</span>
                <div className="btn-group" style={{ maxWidth: '100%', overflowX: 'auto' }}>
                  {categories && categories.map(row => <Link className="btn btn-primary btn-sm" key={row._id} to={`/collectes/${row.url}`}>{row.name}</Link>)}
                  <Link className="btn btn-primary btn-sm" to="/collectes">Aucun</Link>
                </div>
              </div>

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

              <div className="col-12 text-center">
                <ButtonToolbar style={{ display: 'inline-block' }}>
                  <ButtonGroup>
                    { numberOfPage && numberOfPage.map(data => <Button onClick={() => this.changePage(data)} key={`buttonPage_${data}`} color="primary">{data + 1}</Button>)}
                  </ButtonGroup>
                </ButtonToolbar>
              </div>
            </div>
          </Container>
        </div>
      );
    }
}
