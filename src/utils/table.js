import React, { Component } from 'react'
import { Button, DatePicker, Icon, Input, Table } from 'antd'
import _ from 'lodash'
import Highlighter from 'react-highlight-words'
import memoizeOne from 'memoize-one'
import S from 'string'

const {MonthPicker, RangePicker, WeekPicker} = DatePicker

class TableMain extends Component {

  state = {
    data: [],
    size: 'small',
    columns: [],
    pagination: {},
    loading: true,
    searchText: '',
    dataSearchParams: {},
    dateFilters: {},
  }

  handleTableChange = (pagination, filters, sorter) => {
    const pager = {...this.state.pagination}
    pager.current = pagination.current
    this.setState({
      pagination: pager,
    })
    this.fetch2({
      results: pagination.pageSize,
      page: pagination.current,
      sortField: sorter.field,
      sortOrder: sorter.order,
      ...filters,
    })
  }

  fetch = async (params = {}) => {

    this.setState({
      loading: true,
      dataSearchParams: params,
    })

    params.count = params.results

    let data = await this.props.apiRequest({...params})

    let pagination = {...this.state.pagination}
    pagination.total = data.total
    this.setState({
      loading: false,
      data: data.data,
      pagination,

    })

  }

  getColumnSearchProps = (dataIndex) => ({
    filterDropdown: (pro) => {
      let {
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      } = pro

      return (<div style={{
        padding: '8px',
        borderRadius: '4px',
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 8px rgba(0, 0, 0, .15)',
      }
      }>
        <Input
          ref={node => {
            this.searchInput = node
          }}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(
            e.target.value ? [e.target.value] : [])}
          onPressEnter={() => this.handleSearch(selectedKeys, confirm)}
          style={{width: 188, marginBottom: 8, display: 'block'}}
        />
        <Button
          type="primary"
          onClick={() => this.handleSearch(selectedKeys, confirm)}
          icon="search"
          size="small"
          style={{width: 90, marginRight: 8}}
        >
          Search
        </Button>
        <Button
          onClick={() => {
            this.handleReset(clearFilters)
          }}
          size="small"
          style={{width: 90}}
        >
          Reset
        </Button>
      </div>)
    },
    filterIcon: filtered => <Icon type="search" style={{
      color: filtered
        ? '#1890ff'
        : undefined,
    }}/>,
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) {
        setTimeout(() => this.searchInput.select())
      }
    },
    render: (text) => {
      return (
        <React.Fragment>
          {!!text ? (<Highlighter
            highlightStyle={{backgroundColor: '#ffc069', padding: 0}}
            searchWords={[this.state.searchText]}
            autoEscape
            textToHighlight={text.toString()}
          />) : null}
        </React.Fragment>
      )
    },
  })

  getColumnDateSearchProps = (dataIndex) => ({
    filterDropdown: (pro) => {

      let {
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      } = pro

      return (<div style={{
        padding: '8px',
        borderRadius: '4px',
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 8px rgba(0, 0, 0, .15)',
      }}>

        <RangePicker
          style={{width: 250, marginBottom: 8, display: 'block'}}
          ref={node => {
            this.searchInput = node
          }}
          onChange={(date) => {
            setSelectedKeys({
              $gte: date[0].startOf('day').toDate(),
              $lt: date[1].endOf('day').toDate(),
            })
          }}/>

        <div style={{flex: 1, justifyContent: 'flex-end'}}>
          <Button
            type="primary"
            onClick={() => {

              let dateFilters = _.clone(this.state.dateFilters)

              dateFilters[dataIndex] = true

              this.setState({
                dateFilters,
              })

              confirm()
            }}
            icon="search"
            size="small"
            style={{width: 90, marginRight: 8}}
          >
            Search
          </Button>
          <Button
            onClick={() => {
              let dateFilters = _.clone(this.state.dateFilters)

              dateFilters[dataIndex] = false

              this.setState({
                dateFilters,
              })
              clearFilters()
            }}
            size="small"
            style={{width: 90}}
          >
            Reset
          </Button>
        </div>

      </div>)
    },
    filterIcon: x => {
      let {dateFilters} = this.state
      let filtered = dateFilters && dateFilters[dataIndex]
      return <Icon type="search"
                   style={{color: filtered ? '#1890ff' : undefined}}/>
    },
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) {
        setTimeout(() => this.searchInput.focus())
      }
    },
  })

  handleSearch = (selectedKeys, confirm) => {
    confirm()
    this.setState({searchText: selectedKeys[0]})
  }

  handleReset = (clearFilters) => {
    clearFilters()
    this.setState({searchText: ''})
  }

  reload = () => {

    let {apiRequest} = this.props
    if (!!apiRequest) {
      this.fetch(this.state.dataSearchParams)
    }
  }

  setDataState = async () => {

  }

  constructor (props) {
    super(props)
    this.fetch2 = memoizeOne(this.fetch)
  }

  onRowSelectChange = (selectedRowKeys, selectedRows) => {
    this.setState({ selectedRowKeys, selectedRows }, () => {
      const { checkBox } = this.props
      checkBox({selectedRowKeys, selectedRows})
    })
  }

  componentDidUpdate (prevProps) {
    if (!_.isEqual(this.props.columns, prevProps.columns)) {

      let x = []
      _.each(this.props.columns, i => {
        if (i.searchTextName) {
          i = {...this.getColumnSearchProps(i.searchTextName), ...i}
        }

        if (i.searchDateName) {
          i = {...this.getColumnDateSearchProps(i.searchDateName), ...i}
        }

        if (
          i.dataIndex === undefined &&
          i.key !== 'actions' &&
          i.type !== 'actions'
        ) {
          i.dataIndex = i.key
        }

        if (i.title === undefined) {
          i.title = S(i.dataIndex).humanize().titleCase().s
        }
        x.push(i)
      })
      this.setState({
        columns: x,
      })

    }
  }

  componentDidMount () {

    let {pagination, apiRequest} = this.props

    if (!pagination) {
      pagination = {
        defaultPageSize: 10,
      }
    }

    let x = []
    _.each(this.props.columns, (i) => {

      if (i.searchTextName) {
        i = {...this.getColumnSearchProps(i.searchTextName), ...i}
      }

      if (i.searchDateName) {
        i = {...this.getColumnDateSearchProps(i.searchDateName), ...i}
      }

      if (i.dataIndex === undefined && i.key !== 'actions' && i.type !==
        'actions') {
        i.dataIndex = i.key
      }

      if (i.title === undefined) {
        i.title = S(i.dataIndex).humanize().titleCase().s
      }
      x.push(i)

    })

    this.setState({
      columns: x,
    })

    if (!!apiRequest) {
      this.fetch2({
        results: pagination.defaultPageSize,
      })
    }

  }

  renderDynamic () {
    const {columns, selectedRowKeys, selectedRows} = this.state
    const {extraProps, reloadButon, rowKey, checkBox} = this.props
    const rowSelection ={
      selectedRowKeys,
      selectedRows,
      onChange: this.onRowSelectChange
    }
    return (
      <React.Fragment>

        <div style={{marginBottom: 10}}>
          {reloadButon ?
            <Button
              shape="circle" onClick={() => {
              this.reload()
            }} icon="reload"/> : null}
        </div>

        <Table
          bordered
          {...extraProps}
          rowSelection={checkBox && rowSelection}
          columns={columns}
          rowKey={rowKey ? rowKey : record => record._id}
          size={this.state.size}
          dataSource={this.state.data}
          pagination={{
            ...this.state.pagination,
            defaultPageSize: 10,
            pageSizeOptions: ['10', '25', '50', '100'],
            showSizeChanger: true,
            ...this.props.pagination,
          }}
          onChange={this.handleTableChange}
          loading={this.state.loading}
        />

      </React.Fragment>
    )
  }

  renderStatic () {
    const {columns, selectedRowKeys, selectedRows} = this.state
    const {extraProps, dataSource, reloadButon, rowKey, checkBox} = this.props
    const rowSelection ={
      selectedRowKeys,
      selectedRows,
      onChange: this.onRowSelectChange
    }
    return (
      <React.Fragment>

        <div style={{marginBottom: 10}}>
          {reloadButon ?
            <Button
              shape="circle" onClick={() => {
              this.reload()
            }} icon="reload"/> : null}
        </div>

        <Table
          bordered
          {...extraProps}
          columns={columns}
          rowSelection={checkBox && rowSelection}
          rowKey={rowKey ? rowKey : record => record._id}
          size={this.state.size}
          dataSource={dataSource}
          pagination={{
            ...this.state.pagination,
            defaultPageSize: 10,
            pageSizeOptions: ['10', '25', '50', '100'],
            showSizeChanger: true,
            ...this.props.pagination,
          }}
          onChange={() => {

          }}
          loading={this.props.loading}
        />

      </React.Fragment>
    )
  }

  render () {

    const {apiRequest} = this.props

    return (
      <React.Fragment>{!!apiRequest
        ? this.renderDynamic()
        : this.renderStatic()}</React.Fragment>
    )
  }

}

export default TableMain
